const cors = require('cors');
const logger = require('../utils/logger/logger');

// CORS configuration options
const corsOptions = {
  // Allow requests from frontend domains
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3001',
      // Add any other allowed origins here
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Allow credentials (cookies, authorization headers, etc.)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Platform'
  ],

  // Expose headers to client
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Items-Per-Page'
  ],

  // Preflight response cache time (in seconds)
  maxAge: 86400 // 24 hours
};

// Development CORS options (more permissive)
const devCorsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Platform'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Items-Per-Page'
  ],
  maxAge: 86400
};

// Choose CORS configuration based on environment
const corsConfig = process.env.NODE_ENV === 'production' ? corsOptions : devCorsOptions;

// Create CORS middleware
const corsMiddleware = cors(corsConfig);

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    logger.error(`CORS Error: ${err.message} from ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Forbidden'
    });
  }
  next(err);
};

// Log CORS requests in development
const corsLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`CORS Request: ${req.method} ${req.path} from ${req.get('Origin') || 'Unknown'}`);
  }
  next();
};

module.exports = {
  corsMiddleware,
  corsErrorHandler,
  corsLogger
};
