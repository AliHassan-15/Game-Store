const express = require('express');
const router = express.Router();

// Import controller
const authController = require('../../controllers/auth/authController');

// Import middleware
const { authenticate, requireEmailVerification } = require('../../middleware/auth/authMiddleware');
const { validateBody } = require('../../middleware/validation/validationMiddleware');

// Import validation schemas
const { authValidators } = require('../../validators/authValidators');

/**
 * Authentication Routes
 * Base path: /api/v1/auth
 */

// Public routes (no authentication required)
router.post('/register', 
  validateBody(authValidators.register),
  authController.register
);

router.post('/login', 
  validateBody(authValidators.login),
  authController.login
);

// Google OAuth routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// Password reset routes
router.post('/forgot-password',
  validateBody(authValidators.forgotPassword),
  authController.forgotPassword
);

router.post('/reset-password',
  validateBody(authValidators.resetPassword),
  authController.resetPassword
);

// Email verification
router.post('/verify-email',
  validateBody(authValidators.verifyEmail),
  authController.verifyEmail
);

// Protected routes (authentication required)
router.post('/refresh',
  authController.refreshToken
);

router.post('/logout',
  authenticate,
  authController.logout
);

router.get('/profile',
  authenticate,
  authController.getProfile
);

router.put('/profile',
  authenticate,
  requireEmailVerification,
  validateBody(authValidators.updateProfile),
  authController.updateProfile
);

router.put('/change-password',
  authenticate,
  requireEmailVerification,
  validateBody(authValidators.changePassword),
  authController.changePassword
);

router.get('/check',
  authenticate,
  authController.checkAuth
);

module.exports = router;
