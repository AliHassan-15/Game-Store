const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, ActivityLog } = require('../../models');
const { redisUtils } = require('../../config/redis');
const logger = require('../../utils/logger/logger');
class AuthController {

  async register(req, res) {
    try {
      const { email, password, firstName, lastName, phone, role = 'buyer' } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        role
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Store session in Redis
      await redisUtils.storeSession(user.id, {
        userId: user.id,
        email: user.email,
        role: user.role,
        token
      });

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_register',
        'User registered successfully',
        { email, role }
      );

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token
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
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
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

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Store session in Redis
      await redisUtils.storeSession(user.id, {
        userId: user.id,
        email: user.email,
        role: user.role,
        token
      });

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_login',
        'User logged in successfully',
        { email, ipAddress: req.ip }
      );

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token
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
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      const userId = req.user.id;

      // Delete session from Redis
      await redisUtils.deleteSession(userId);

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_logout',
        'User logged out successfully',
        { email: req.user.email }
      );

      logger.info(`User logged out: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Logout successful'
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
        include: [
          { model: require('../../models').UserAddress, as: 'addresses' },
          { model: require('../../models').UserPayment, as: 'payments' }
        ]
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
          user: user.toJSON()
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
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user profile
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        avatar: avatar || user.avatar
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_update',
        'User profile updated',
        { updatedFields: Object.keys(req.body) }
      );

      logger.info(`User profile updated: ${user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
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
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
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
      await user.update({ password: newPassword });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_update',
        'Password changed successfully',
        { email: user.email }
      );

      logger.info(`Password changed for user: ${user.email}`);

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
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // TODO: Send email with reset link
      // For now, just log the token (in production, send email)
      logger.info(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Find user with reset token
      const user = await User.findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password and clear reset token
      await user.update({
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_update',
        'Password reset successfully',
        { email: user.email }
      );

      logger.info(`Password reset for user: ${user.email}`);

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
   * GET /api/v1/auth/verify-email/:token
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }

      // Mark email as verified
      await user.update({
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_update',
        'Email verified successfully',
        { email: user.email }
      );

      logger.info(`Email verified for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify email',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Refresh JWT token
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid user or account deactivated'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update session in Redis
      await redisUtils.storeSession(user.id, {
        userId: user.id,
        email: user.email,
        role: user.role,
        token: newToken
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken
        }
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Google OAuth callback
   * GET /api/v1/auth/google/callback
   */
  async googleCallback(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Google authentication failed'
        });
      }

      const user = req.user;

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Store session in Redis
      await redisUtils.storeSession(user.id, {
        userId: user.id,
        email: user.email,
        role: user.role,
        token
      });

      // Log activity
      await ActivityLog.createUserActivity(
        user.id,
        'user_login',
        'User logged in via Google OAuth',
        { email: user.email, method: 'google' }
      );

      logger.info(`User logged in via Google: ${user.email}`);

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  /**
   * Check authentication status
   * GET /api/v1/auth/check
   */
  async checkAuth(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated or account deactivated'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          isAuthenticated: true
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
