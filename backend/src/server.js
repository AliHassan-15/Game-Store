const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const routes = require('./routes');

// Import utilities
const logger = require('./utils/logger/logger');

// Import authentication configuration
const { setupAuthMiddleware } = require('./config/auth-simple');

// Import database
const { sequelize } = require('./models');

// Create Express app
const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup authentication middleware (sessions, passport, cookies)
// setupAuthMiddleware(app);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Mount all routes
app.use('/', routes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Sync database tables
    await sequelize.sync({ force: true }); // Force recreate all tables
    logger.info('Database synchronized successfully');
    
    const server = app.listen(PORT, () => {
      logger.startup('Server', 'started', { port: PORT, environment: process.env.NODE_ENV });
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        await sequelize.close();
        logger.info('HTTP server closed');
        process.exit(0);
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle SIGTERM and SIGINT
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
startServer();

// Export app for testing
module.exports = app;
