const { User, ActivityLog } = require('../../models');
const { redisUtils } = require('../../config/redis');
const { 
  generateAuthTokens, 
  validateAndRefreshTokens, 
  clearAuthCookies,
  blacklistToken 
} = require('../../middleware/auth/jwtMiddleware');
const { 
  authenticateLocal, 
  authenticateGoogle, 
  authenticateGoogleCallback,
  logoutUser 
} = require('../../middleware/auth/authMiddleware-simple');
const { validateBody } = require('../../middleware/validation/validationMiddleware');
const { commonSchemas } = require('../../middleware/validation/validationMiddleware');
const logger = require('../../utils/logger/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Auth Controller - Handles authentication and authorization
 */

class AuthController {

  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        password, 
        phone,
        role = 'buyer'
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ 
        where: { email: email.toLowerCase() } 
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        phone,
        role,
        isActive: true,
        isVerified: false
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Generate authentication tokens
      const { accessToken, refreshToken } = await generateAuthTokens(
        user.id, 
        user.role, 
        res
      );

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_register',
        'User registered successfully',
        { 
          email: user.email,
          role: user.role
        }
      );

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Register admin user (for initial setup)
   * POST /api/v1/auth/register-admin
   */
  async registerAdmin(req, res) {
    try {
      const { firstName, lastName, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create admin user (password will be hashed automatically by the model hook)
      const user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'admin',
        isVerified: true,
        isActive: true
      });

      // Generate tokens
      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          type: 'refresh'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Admin user registered successfully',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            avatar: user.avatar
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Admin registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Admin registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Login user (local authentication)
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { email: email.toLowerCase() } 
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check if user has password (not OAuth user)
      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: 'Please use Google login for this account'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate authentication tokens
      const { accessToken, refreshToken } = await generateAuthTokens(
        user.id, 
        user.role, 
        res
      );

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_login',
        'User logged in successfully',
        { 
          email: user.email,
          loginMethod: 'local'
        }
      );

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            avatar: user.avatar
          },
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Google OAuth login
   * GET /api/v1/auth/google
   */
  async googleLogin(req, res, next) {
    authenticateGoogle(req, res, next);
  }

  /**
   * Google OAuth callback
   * GET /api/v1/auth/google/callback
   */
  async googleCallback(req, res, next) {
    try {
      authenticateGoogleCallback(req, res, async (err) => {
        if (err) {
          logger.error('Google OAuth callback error:', err);
          return res.status(500).json({
            success: false,
            message: 'Google authentication failed'
          });
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Google authentication failed'
          });
        }

        // Generate authentication tokens
        const { accessToken, refreshToken } = await generateAuthTokens(
          req.user.id, 
          req.user.role, 
          res
        );

        // Log activity
        await ActivityLog.createUserActivity(
          req.user.id,
          'user_login',
          'User logged in via Google OAuth',
          { 
            email: req.user.email,
            loginMethod: 'google'
          }
        );

        logger.info(`User logged in via Google: ${req.user.email}`);

        // Redirect to frontend with tokens
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
        res.redirect(redirectUrl);

      });
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Google authentication failed'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Validate and refresh tokens
      const result = await validateAndRefreshTokens(req, res);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      const userId = req.user?.id;
      const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

      if (token) {
        // Blacklist the token
        await blacklistToken(token);
      }

      if (userId) {
        // Clear session from Redis
        await redisUtils.deleteSession(userId);

        // Log activity
        await ActivityLog.createUserActivity(
          userId,
          'user_logout',
          'User logged out',
          { 
            email: req.user.email
          }
        );

        logger.info(`User logged out: ${req.user.email}`);
      }

      // Clear cookies
      clearAuthCookies(res);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: ['addresses', 'payments']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            addresses: user.addresses || [],
            payments: user.payments || []
          }
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, phone, avatar } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        avatar: avatar || user.avatar
      });

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_profile_update',
        'User profile updated',
        { 
          updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined)
        }
      );

      logger.info(`User profile updated: ${user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified
          }
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Change password
   * PUT /api/v1/auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has password (not OAuth user)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change password for OAuth accounts'
        });
      }

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_password_change',
        'User password changed',
        { 
          email: user.email
        }
      );

      logger.info(`User password changed: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Forgot password
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has password (not OAuth user)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reset password for OAuth accounts'
        });
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // TODO: Send email with reset link
      // For now, just return the token
      res.json({
        success: true,
        message: 'Password reset email sent',
        data: {
          resetToken // Remove this in production
        }
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process forgot password request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        where: { passwordResetToken: token }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Check if token is expired
      if (user.passwordResetExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Reset token has expired'
        });
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_password_reset',
        'User password reset',
        { 
          email: user.email
        }
      );

      logger.info(`User password reset: ${user.email}`);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset password',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        where: { emailVerificationToken: token }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }

      // Check if token is expired
      if (user.emailVerificationExpires < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Verification token has expired'
        });
      }

      // Verify email
      user.isVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_email_verify',
        'User email verified',
        { 
          email: user.email
        }
      );

      logger.info(`User email verified: ${user.email}`);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify email',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Check authentication status
   * GET /api/v1/auth/check
   */
  async checkAuth(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      res.json({
        success: true,
        message: 'Authenticated',
        data: {
          user: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            role: req.user.role,
            isVerified: req.user.isVerified
          }
        }
      });

    } catch (error) {
      logger.error('Check auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check authentication',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();
