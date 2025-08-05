const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

// Import configurations
const { database } = require('./config/database');
const { redisClient } = require('./config/redis');
const { initializeSessionStore } = require('./config/passport');

// Import middleware
const { errorHandler, asyncHandler, notFoundHandler } = require('./middleware/errorHandler');
const { 
  requestLogger, 
  errorLogger, 
  performanceLogger, 
  securityLogger, 
  apiUsageLogger,
  devLogger,
  prodLogger 
} = require('./middleware/logger');
const { 
  apiLimiter, 
  authLimiter, 
  passwordResetLimiter, 
  uploadLimiter, 
  orderLimiter, 
  reviewLimiter, 
  adminLimiter 
} = require('./middleware/rateLimiter');

// Import routes
const routes = require('./routes');

// Import utilities
const logger = require('./utils/logger/logger');
const { ENV, SESSION } = require('./utils/constants/constants');

// Create Express app
const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Session configuration
const sessionStore = initializeSessionStore(redisClient);
app.use(session({
  store: sessionStore,
  secret: SESSION.SECRET,
  resave: SESSION.RESAVE,
  saveUninitialized: SESSION.SAVE_UNINITIALIZED,
  cookie: {
    secure: SESSION.COOKIE_SECURE,
    httpOnly: SESSION.COOKIE_HTTP_ONLY,
    sameSite: SESSION.COOKIE_SAME_SITE,
    maxAge: SESSION.COOKIE_MAX_AGE
  },
  name: 'gamestore.sid'
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
if (process.env.NODE_ENV === ENV.DEVELOPMENT) {
  app.use(morgan('dev', { stream: logger.stream }));
  app.use(devLogger);
} else {
  app.use(morgan('combined', { stream: logger.stream }));
  app.use(prodLogger);
}

// Custom logging middleware
app.use(requestLogger);
app.use(errorLogger);
app.use(performanceLogger);
app.use(securityLogger);
app.use(apiUsageLogger);

// Rate limiting middleware - apply to specific routes
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/auth/forgot-password', passwordResetLimiter);
app.use('/api/v1/auth/reset-password', passwordResetLimiter);
app.use('/api/v1/upload', uploadLimiter);
app.use('/api/v1/orders', orderLimiter);
app.use('/api/v1/reviews', reviewLimiter);
app.use('/api/v1/admin', adminLimiter);

// General API rate limiting
app.use('/api', apiLimiter);

// API routes - mount the main routes file
app.use('/', routes);

// Stripe webhook endpoint (no body parsing for webhooks)
app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const paymentService = require('./services/payment/paymentService');
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    await paymentService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

// 404 handler for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connection
    await database.close();
    logger.info('Database connection closed');
    
    // Close Redis connection
    await redisClient.quit();
    logger.info('Redis connection closed');
    
    // Close server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle SIGTERM and SIGINT
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  try {
    // Test database connection
    await database.authenticate();
    logger.startup('Database', 'connected');
    
    // Sync database (in development)
    if (process.env.NODE_ENV === ENV.DEVELOPMENT) {
      await database.sync({ alter: true });
      logger.startup('Database', 'synced');
    }
    
    // Test Redis connection
    await redisClient.ping();
    logger.startup('Redis', 'connected');
    
    logger.startup('Server', 'started', { port: PORT, environment: process.env.NODE_ENV });
    
    // Log memory usage
    const memUsage = process.memoryUsage();
    logger.memory(memUsage);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Export app for testing
module.exports = app;
