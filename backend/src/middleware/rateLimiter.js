const rateLimit = require('express-rate-limit');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger/logger');

/**
 * Rate Limiter Middleware
 * Prevents API abuse and protects against DDoS attacks
 */

// Redis store for rate limiting
const RedisStore = require('rate-limit-redis').default;

// General API rate limiter
const apiLimiter = rateLimit({
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.call(...args),
  // }), // Temporarily disabled Redis store
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // 15 minutes in minutes
    });
  }
});

// Authentication rate limiter (more strict)
const authLimiter = rateLimit({
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.call(...args),
  // }), // Temporarily disabled Redis store
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // 15 minutes in minutes
    });
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: Math.ceil(60 * 60 / 60) // 1 hour in minutes
    });
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
      retryAfter: Math.ceil(60 * 60 / 60) // 1 hour in minutes
    });
  }
});

// Order creation rate limiter
const orderLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 orders per hour
  message: {
    success: false,
    message: 'Too many order attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Order rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many order attempts, please try again later.',
      retryAfter: Math.ceil(60 * 60 / 60) // 1 hour in minutes
    });
  }
});

// Review creation rate limiter
const reviewLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // Limit each IP to 20 reviews per day
  message: {
    success: false,
    message: 'Too many review submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Review rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many review submissions, please try again later.',
      retryAfter: Math.ceil(24 * 60 * 60 / 60) // 24 hours in minutes
    });
  }
});

// Admin API rate limiter (more permissive for admin users)
const adminLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  },
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many admin requests, please try again later.',
      retryAfter: Math.ceil(15 * 60 / 60) // 15 minutes in minutes
    });
  }
});

// Dynamic rate limiter based on user role
const dynamicLimiter = (options = {}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: (req) => {
      // Different limits based on user role
      if (req.user && req.user.role === 'admin') {
        return options.adminMax || 500;
      }
      if (req.user && req.user.role === 'buyer') {
        return options.userMax || 100;
      }
      return options.guestMax || 50;
    },
    skip: options.skip,
    message: options.message || {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Dynamic rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        userId: req.user?.id,
        userRole: req.user?.role,
        timestamp: new Date().toISOString()
      });
      
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / (60 * 1000))
      });
    }
  });
};

// Whitelist certain IPs (for development or trusted sources)
const whitelistedIPs = [
  '127.0.0.1', // localhost
  '::1', // localhost IPv6
  // Add other trusted IPs here
];

// Skip rate limiting for whitelisted IPs
const skipWhitelistedIPs = (req) => {
  return whitelistedIPs.includes(req.ip);
};

// Apply whitelist to all limiters
const applyWhitelist = (limiter) => {
  return (req, res, next) => {
    if (skipWhitelistedIPs(req)) {
      return next();
    }
    return limiter(req, res, next);
  };
};

module.exports = {
  apiLimiter: applyWhitelist(apiLimiter),
  authLimiter: applyWhitelist(authLimiter),
  passwordResetLimiter: applyWhitelist(passwordResetLimiter),
  uploadLimiter: applyWhitelist(uploadLimiter),
  orderLimiter: applyWhitelist(orderLimiter),
  reviewLimiter: applyWhitelist(reviewLimiter),
  adminLimiter: applyWhitelist(adminLimiter),
  dynamicLimiter,
  skipWhitelistedIPs
};
