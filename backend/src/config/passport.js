const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { redisUtils } = require('./redis');
const logger = require('../utils/logger/logger');

// Session serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Session deserialization
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    if (!user || !user.isActive) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    logger.error('Session deserialization error:', error);
    done(error);
  }
});

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return done(null, false, { message: 'Account is deactivated' });
    }

    // Check if user has password (not OAuth user)
    if (!user.password) {
      return done(null, false, { message: 'Please use Google login for this account' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Log successful login
    logger.info(`User logged in: ${user.email}`);

    return done(null, user);
  } catch (error) {
    logger.error('Local authentication error:', error);
    return done(error);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const { id, displayName, emails, photos } = profile;
    
    // Check if user already exists
    let user = await User.findOne({ 
      where: { googleId: id } 
    });

    if (user) {
      // Update existing user
      await user.update({
        lastLogin: new Date(),
        avatar: photos?.[0]?.value || user.avatar
      });
      
      logger.info(`Google OAuth user logged in: ${user.email}`);
      return done(null, user);
    }

    // Check if email already exists (different OAuth provider or local account)
    const email = emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ where: { email: email.toLowerCase() } });
      
      if (user) {
        // Link Google account to existing user
        await user.update({
          googleId: id,
          isVerified: true,
          lastLogin: new Date(),
          avatar: photos?.[0]?.value || user.avatar
        });
        
        logger.info(`Google OAuth linked to existing account: ${user.email}`);
        return done(null, user);
      }
    }

    // Create new user
    const [firstName, ...lastNameParts] = displayName.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    user = await User.create({
      googleId: id,
      email: email,
      firstName: firstName || '',
      lastName: lastName || '',
      avatar: photos?.[0]?.value,
      isVerified: true,
      role: 'buyer',
      isActive: true
    });

    logger.info(`New Google OAuth user created: ${user.email}`);
    return done(null, user);
  } catch (error) {
    logger.error('Google OAuth authentication error:', error);
    return done(error);
  }
}));

// Session Strategy (for Redis-based sessions)
passport.use('session', new LocalStrategy({
  usernameField: 'sessionId',
  passwordField: 'token',
  passReqToCallback: true
}, async (req, sessionId, token, done) => {
  try {
    // Get session from Redis
    const session = await redisUtils.getSession(sessionId);
    
    if (!session || !session.token || session.token !== token) {
      return done(null, false, { message: 'Invalid session' });
    }

    // Get user from database
    const user = await User.findByPk(session.userId);
    
    if (!user || !user.isActive) {
      return done(null, false, { message: 'User not found or inactive' });
    }

    return done(null, user);
  } catch (error) {
    logger.error('Session authentication error:', error);
    return done(error);
  }
}));

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
};

// Role-based authorization middleware
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
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
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
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

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.user = null;
  next();
};

// Logout user
const logoutUser = async (req, res, next) => {
  try {
    if (req.user) {
      // Clear session from Redis
      await redisUtils.deleteSession(req.user.id);
      
      // Log logout
      logger.info(`User logged out: ${req.user.email}`);
    }

    // Clear session
    req.logout((err) => {
      if (err) {
        logger.error('Logout error:', err);
        return next(err);
      }
      
      // Clear cookies
      res.clearCookie('connect.sid');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      next();
    });
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// Initialize session
const initializeSession = async (req, res, next) => {
  try {
    // Check for session cookie
    const sessionId = req.cookies?.['connect.sid'];
    
    if (sessionId) {
      // Get session from Redis
      const session = await redisUtils.getSession(sessionId);
      
      if (session && session.userId) {
        // Get user from database
        const user = await User.findByPk(session.userId);
        
        if (user && user.isActive) {
          req.user = user;
          req.isAuthenticated = () => true;
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Session initialization error:', error);
    next();
  }
};

// Session store for Redis
const RedisStore = require('connect-redis').default;
const session = require('express-session');

const createSessionStore = (redisClient) => {
  return new RedisStore({
    client: redisClient,
    prefix: 'sess:',
    ttl: 24 * 60 * 60, // 24 hours
    disableTouch: false
  });
};

// Session configuration
const sessionConfig = {
  store: null, // Will be set when Redis client is available
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

// Initialize session store
const initializeSessionStore = (redisClient) => {
  sessionConfig.store = createSessionStore(redisClient);
};

module.exports = {
  passport,
  isAuthenticated,
  hasRole,
  isAdmin,
  optionalAuth,
  logoutUser,
  initializeSession,
  sessionConfig,
  initializeSessionStore
};
