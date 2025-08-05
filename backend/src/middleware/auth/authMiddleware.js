const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../../models');
const { redisUtils } = require('../../config/redis');
const logger = require('../../utils/logger/logger');

// Verify JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get token from request
const getTokenFromRequest = (req) => {
  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  // Check cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  // Check query parameter (for email verification links)
  if (req.query.token) {
    return req.query.token;
  }

  return null;
};

// Get refresh token from request
const getRefreshTokenFromRequest = (req) => {
  // Check cookies first
  if (req.cookies && req.cookies.refreshToken) {
    return req.cookies.refreshToken;
  }

  // Check Authorization header with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

// Main authentication middleware - Hybrid approach
const authenticate = async (req, res, next) => {
  try {
    // First, try session-based authentication (Redis + Cookies)
    if (req.isAuthenticated && req.isAuthenticated()) {
      // User is authenticated via session
      logger.debug('User authenticated via session');
      return next();
    }

    // Check for session cookie
    const sessionId = req.cookies?.['connect.sid'];
    if (sessionId) {
      const session = await redisUtils.getSession(sessionId);
      if (session && session.userId) {
        const user = await User.findByPk(session.userId);
        if (user && user.isActive) {
          req.user = user;
          req.isAuthenticated = () => true;
          logger.debug('User authenticated via Redis session');
          return next();
        }
      }
    }

    // Fallback to JWT token authentication (for API clients)
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - No session or token found'
      });
    }

    // Verify JWT token
    const { success, decoded, error } = await verifyToken(token);
    
    if (!success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await redisUtils.keyExists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated'
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    req.authMethod = 'jwt';

    logger.debug('User authenticated via JWT token');
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Session-only authentication (for web applications)
const authenticateSession = (req, res, next) => {
  passport.authenticate('session', { session: false }, async (err, user, info) => {
    if (err) {
      logger.error('Session authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    req.authMethod = 'session';
    next();
  })(req, res, next);
};

// JWT-only authentication (for API clients)
const authenticateJWT = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'JWT token required'
      });
    }

    // Verify token
    const { success, decoded, error } = await verifyToken(token);
    
    if (!success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired JWT token'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisUtils.keyExists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'JWT token has been invalidated'
      });
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    req.token = token;
    req.authMethod = 'jwt';

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'JWT authentication failed'
    });
  }
};

// Optional authentication (user can be authenticated or not)
const optionalAuth = async (req, res, next) => {
  try {
    // Try session first
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    // Try Redis session
    const sessionId = req.cookies?.['connect.sid'];
    if (sessionId) {
      const session = await redisUtils.getSession(sessionId);
      if (session && session.userId) {
        const user = await User.findByPk(session.userId);
        if (user && user.isActive) {
          req.user = user;
          req.authMethod = 'session';
          return next();
        }
      }
    }

    // Try JWT token
    const token = getTokenFromRequest(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const { success, decoded } = await verifyToken(token);
    
    if (!success) {
      req.user = null;
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisUtils.keyExists(`blacklist:${token}`);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      req.user = null;
      return next();
    }

    req.user = user;
    req.token = token;
    req.authMethod = 'jwt';
    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Buyer authorization middleware
const requireBuyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'buyer') {
    return res.status(403).json({
      success: false,
      message: 'Buyer access required'
    });
  }

  next();
};

// Resource ownership middleware
const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required'
        });
      }

      // Get resource
      const resource = await resourceModel.findByPk(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check ownership (assuming resource has userId field)
      if (resource.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own resources'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Email verification middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isVerified && !req.user.googleId) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED'
    });
  }

  next();
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Valid session required'
      });
    }

    // For session-based auth, check Redis session
    if (req.authMethod === 'session') {
      const sessionId = req.cookies?.['connect.sid'];
      if (!sessionId) {
        return res.status(401).json({
          success: false,
          message: 'Session cookie required'
        });
      }

      const session = await redisUtils.getSession(sessionId);
      if (!session || session.userId !== req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Session expired or invalid'
        });
      }
    }

    // For JWT auth, check token blacklist
    if (req.authMethod === 'jwt' && req.token) {
      const isBlacklisted = await redisUtils.keyExists(`blacklist:${req.token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: 'Token has been invalidated'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Session validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Session validation failed'
    });
  }
};

// Rate limiting based on user role
const rateLimitByRole = (options = {}) => {
  return (req, res, next) => {
    // Skip rate limiting for admin users
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Apply different rate limits based on user role
    const limits = {
      guest: options.guest || 10,
      buyer: options.buyer || 100,
      admin: options.admin || 1000
    };

    const userRole = req.user ? req.user.role : 'guest';
    const limit = limits[userRole];

    // Simple in-memory rate limiting (for production, use Redis)
    const key = `${req.ip}:${userRole}`;
    const now = Date.now();
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes

    if (!req.app.locals.rateLimit) {
      req.app.locals.rateLimit = new Map();
    }

    const userRequests = req.app.locals.rateLimit.get(key) || [];
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded'
      });
    }

    validRequests.push(now);
    req.app.locals.rateLimit.set(key, validRequests);

    next();
  };
};

// Passport local authentication middleware
const authenticateLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      logger.error('Local authentication error:', err);
      return res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid credentials'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Passport Google OAuth authentication middleware
const authenticateGoogle = (req, res, next) => {
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
};

// Passport Google OAuth callback middleware
const authenticateGoogleCallback = (req, res, next) => {
  passport.authenticate('google', { 
    failureRedirect: '/auth/google/failure',
    session: false 
  }, (err, user, info) => {
    if (err) {
      logger.error('Google OAuth callback error:', err);
      return res.status(500).json({
        success: false,
        message: 'Google authentication failed'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Check if user is authenticated (for both token and session)
const isAuthenticated = (req, res, next) => {
  // First try session-based authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Then try token-based authentication
  const token = getTokenFromRequest(req);
  
  if (token) {
    return authenticateJWT(req, res, next);
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

// Check if user has specific role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Logout user (clear session and tokens)
const logoutUser = async (req, res, next) => {
  try {
    if (req.user && req.token) {
      // Blacklist the current token
      await redisUtils.setEx(
        `blacklist:${req.token}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify({ userId: req.user.id, type: 'logout' })
      );

      // Clear session from Redis
      await redisUtils.del(`session:${req.user.id}`);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('connect.sid');

    // Clear session
    if (req.session) {
      req.session.destroy();
    }

    next();
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

module.exports = {
  authenticate,
  authenticateSession,
  authenticateJWT,
  optionalAuth,
  authorize,
  requireAdmin,
  requireBuyer,
  requireOwnership,
  requireEmailVerification,
  validateSession,
  rateLimitByRole,
  authenticateLocal,
  authenticateGoogle,
  authenticateGoogleCallback,
  isAuthenticated,
  hasRole,
  logoutUser,
  getTokenFromRequest,
  getRefreshTokenFromRequest,
  verifyToken
};
