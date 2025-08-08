const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../../models');
const logger = require('../../utils/logger/logger');

// Verify JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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

// Main authentication middleware - Simplified approach
const authenticate = async (req, res, next) => {
  try {
    // First, try session-based authentication
    if (req.isAuthenticated && req.isAuthenticated()) {
      // User is authenticated via session
      logger.debug('User authenticated via session');
      return next();
    }

    // Fallback to JWT token authentication
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