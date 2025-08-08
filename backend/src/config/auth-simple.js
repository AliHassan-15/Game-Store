const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const logger = require('../utils/logger/logger');

// Import passport strategies
require('./passport');

/**
 * Simplified Authentication Configuration
 * Sets up session management and passport without Redis dependency
 */

// Session configuration (memory store)
const getSessionConfig = () => {
  return {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'connect.sid'
  };
};

// Cookie parser configuration
const getCookieParserConfig = () => {
  return {
    secret: process.env.SESSION_SECRET || 'your-secret-key'
  };
};

// Passport configuration
const getPassportConfig = () => {
  return {
    initialize: passport.initialize(),
    session: passport.session()
  };
};

// Simplified authentication middleware setup
const setupAuthMiddleware = (app) => {
  try {
    // Cookie parser middleware
    app.use(cookieParser(getCookieParserConfig().secret));

    // Session middleware (memory store)
    app.use(session(getSessionConfig()));

    // Passport middleware
    app.use(getPassportConfig().initialize);
    app.use(getPassportConfig().session);

    logger.info('Simplified authentication middleware setup completed');
    return true;
  } catch (error) {
    logger.error('Failed to setup authentication middleware:', error);
    return false;
  }
};

module.exports = {
  getSessionConfig,
  getCookieParserConfig,
  getPassportConfig,
  setupAuthMiddleware
}; 