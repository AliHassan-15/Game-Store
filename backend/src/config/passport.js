const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger/logger');

// Passport configuration with camelCase variables
const passportConfig = {
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL
};

// Import User model (will be available after models are created)
let UserModel;

// Initialize passport with User model
const initializePassport = (UserModel) => {
  UserModel = UserModel;
  
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (userId, done) => {
    try {
      const user = await UserModel.findByPk(userId);
      done(null, user);
    } catch (error) {
      logger.error('Passport deserialize error:', error.message);
      done(error, null);
    }
  });

  // Local Strategy for email/password authentication
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (request, email, password, done) => {
    try {
      // Find user by email
      const user = await UserModel.findOne({ 
        where: { email: email.toLowerCase() },
        include: ['addresses', 'payments']
      });

      if (!user) {
        logger.warn(`Login attempt failed: User not found - ${email}`);
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.is_active) {
        logger.warn(`Login attempt failed: Inactive user - ${email}`);
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        logger.warn(`Login attempt failed: Invalid password - ${email}`);
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      logger.info(`User logged in successfully: ${email}`);
      return done(null, user);
    } catch (error) {
      logger.error('Local strategy error:', error.message);
      return done(error, null);
    }
  }));

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: passportConfig.googleClientId,
    clientSecret: passportConfig.googleClientSecret,
    callbackURL: passportConfig.googleCallbackUrl,
    passReqToCallback: true
  }, async (request, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await UserModel.findOne({ 
        where: { google_id: profile.id },
        include: ['addresses', 'payments']
      });

      if (user) {
        // Update last login for existing user
        await user.update({ last_login: new Date() });
        logger.info(`Google OAuth login: Existing user - ${user.email}`);
        return done(null, user);
      }

      // Check if email already exists (user might have signed up with email first)
      user = await UserModel.findOne({ 
        where: { email: profile.emails[0].value.toLowerCase() },
        include: ['addresses', 'payments']
      });

      if (user) {
        // Link Google account to existing user
        await user.update({ 
          google_id: profile.id,
          last_login: new Date()
        });
        logger.info(`Google OAuth login: Linked to existing user - ${user.email}`);
        return done(null, user);
      }

      // Create new user from Google profile
      const newUser = await UserModel.create({
        email: profile.emails[0].value.toLowerCase(),
        firstName: profile.name.givenName || profile.displayName.split(' ')[0],
        lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || '',
        google_id: profile.id,
        avatar: profile.photos[0]?.value || null,
        is_verified: true, // Google accounts are pre-verified
        is_active: true,
        role: 'buyer' // Default role for new users
      });

      logger.info(`Google OAuth login: New user created - ${newUser.email}`);
      return done(null, newUser);
    } catch (error) {
      logger.error('Google strategy error:', error.message);
      return done(error, null);
    }
  }));

  logger.info('Passport strategies configured successfully');
};

// Authentication middleware
const passportMiddleware = {
  // Authenticate with local strategy
  authenticateLocal: passport.authenticate('local', { 
    session: false,
    failWithError: true 
  }),

  // Authenticate with Google OAuth
  authenticateGoogle: passport.authenticate('google', { 
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  }),

  // Handle Google OAuth callback
  authenticateGoogleCallback: passport.authenticate('google', { 
    session: false,
    failWithError: true 
  }),

  // Check if user is authenticated
  isAuthenticated: (request, response, next) => {
    if (request.isAuthenticated()) {
      return next();
    }
    return response.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  },

  // Check if user has specific role
  hasRole: (allowedRoles) => {
    return (request, response, next) => {
      if (!request.isAuthenticated()) {
        return response.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userRole = request.user.role;
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!rolesArray.includes(userRole)) {
        return response.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }

      return next();
    };
  },

  // Check if user is admin
  isAdmin: (request, response, next) => {
    if (!request.isAuthenticated()) {
      return response.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (request.user.role !== 'admin') {
      return response.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    return next();
  },

  // Optional authentication (user can be authenticated or not)
  optionalAuth: (request, response, next) => {
    if (request.isAuthenticated()) {
      // User is authenticated, continue
      return next();
    }
    // User is not authenticated, but continue anyway
    request.user = null;
    return next();
  }
};

// Logout function
const logoutUser = (request, response, next) => {
  request.logout((error) => {
    if (error) {
      logger.error('Logout error:', error.message);
      return next(error);
    }
    logger.info(`User logged out: ${request.user?.email || 'Unknown'}`);
    response.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
};

module.exports = {
  passport,
  passportConfig,
  initializePassport,
  passportMiddleware,
  logoutUser
};
