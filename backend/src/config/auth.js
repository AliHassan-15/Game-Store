const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const { redisClient } = require('./redis');
const { sessionConfig, initializeSessionStore } = require('./passport');
const logger = require('../utils/logger/logger');

/**
 * Authentication Configuration
 * Sets up session management, passport, and Redis session store
 */

// Initialize Redis session store
const initializeAuth = () => {
  try {
    // Check if Redis is connected
    if (!redisClient.isReady) {
      logger.warn('Redis not connected, skipping session store initialization');
      return false;
    }

    // Initialize session store with Redis
    initializeSessionStore(redisClient);
    
    logger.info('Authentication system initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize authentication system:', error);
    return false;
  }
};

// Session configuration with Redis store
const getSessionConfig = () => {
  return {
    ...sessionConfig,
    store: sessionConfig.store,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    },
    name: 'connect.sid'
  };
};

// Cookie parser configuration
const getCookieParserConfig = () => {
  return {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
};

// Passport configuration
const getPassportConfig = () => {
  return {
    initialize: passport.initialize(),
    session: passport.session()
  };
};

// Authentication middleware setup
const setupAuthMiddleware = (app) => {
  try {
    // Cookie parser middleware (always needed)
    app.use(cookieParser(getCookieParserConfig().secret));

    // Initialize authentication system (with error handling)
    try {
      initializeAuth();
    } catch (authError) {
      logger.warn('Authentication system initialization failed, continuing without Redis:', authError.message);
    }

    // Session middleware with fallback to memory store if Redis fails
    const sessionConfig = getSessionConfig();
    if (!sessionConfig.store) {
      logger.warn('Using memory session store (Redis not available)');
      delete sessionConfig.store; // Use default memory store
    }

    app.use(session(sessionConfig));

    // Passport middleware
    app.use(getPassportConfig().initialize);
    app.use(getPassportConfig().session);

    logger.info('Authentication middleware setup completed');
    return true;
  } catch (error) {
    logger.error('Failed to setup authentication middleware:', error);
    // Continue without authentication middleware
    return false;
  }
};

// Session cleanup utility
const cleanupSessions = async () => {
  try {
    const keys = await redisClient.keys('sess:*');
    let cleanedCount = 0;

    for (const key of keys) {
      const ttl = await redisClient.ttl(key);
      if (ttl <= 0) {
        await redisClient.del(key);
        cleanedCount++;
      }
    }

    logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    return { success: true, cleanedCount };
  } catch (error) {
    logger.error('Session cleanup error:', error);
    return { success: false, error: error.message };
  }
};

// Session monitoring utility
const getSessionStats = async () => {
  try {
    const keys = await redisClient.keys('sess:*');
    const blacklistKeys = await redisClient.keys('blacklist:*');
    
    return {
      success: true,
      stats: {
        activeSessions: keys.length,
        blacklistedTokens: blacklistKeys.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('Session stats error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeAuth,
  getSessionConfig,
  getCookieParserConfig,
  getPassportConfig,
  setupAuthMiddleware,
  cleanupSessions,
  getSessionStats
}; 