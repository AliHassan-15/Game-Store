const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../../models');
const { redisUtils } = require('../../config/redis');
const { emailService } = require('../email/emailService');
const logger = require('../../utils/logger/logger');

class AuthService {

  async register(userData) {
    try {
      const { email, password, firstName, lastName, phone, role = 'buyer' } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isVerified: false,
        isActive: true
      });

      // Send verification email
      await this.sendVerificationEmail(user.email, verificationToken, user.firstName);

      // Remove sensitive data before returning
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.emailVerificationToken;
      delete userResponse.emailVerificationExpires;
      delete userResponse.passwordResetToken;
      delete userResponse.passwordResetExpires;

      logger.info(`New user registered: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Check if user has password (for Google OAuth users)
      if (!user.password) {
        throw new Error('Please use Google login for this account');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Remove sensitive data before returning
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.emailVerificationToken;
      delete userResponse.emailVerificationExpires;
      delete userResponse.passwordResetToken;
      delete userResponse.passwordResetExpires;

      logger.info(`User logged in: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        // Don't reveal if user exists or not for security
        return { message: 'If an account with this email exists, a password reset link has been sent.' };
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await user.update({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      });

      // Send reset email
      await this.sendPasswordResetEmail(user.email, resetToken, user.firstName);

      logger.info(`Password reset requested for: ${user.email}`);
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    try {
      // Find user with valid reset token
      const user = await User.findOne({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await user.update({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      logger.info(`Password reset successful for: ${user.email}`);
      return { message: 'Password has been reset successfully' };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      // Find user with valid verification token
      const user = await User.findOne({
        where: {
          emailVerificationToken: token,
          emailVerificationExpires: { [require('sequelize').Op.gt]: new Date() }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      if (user.isVerified) {
        throw new Error('Email is already verified');
      }

      // Mark email as verified
      await user.update({
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });

      logger.info(`Email verified for: ${user.email}`);
      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        throw new Error('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update verification token
      await user.update({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      });

      // Send verification email
      await this.sendVerificationEmail(user.email, verificationToken, user.firstName);

      logger.info(`Verification email resent to: ${user.email}`);
      return { message: 'Verification email sent successfully' };
    } catch (error) {
      logger.error('Resend verification email error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password: hashedPassword });

      logger.info(`Password changed for user: ${user.email}`);
      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Remove sensitive data before returning
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.emailVerificationToken;
      delete userResponse.emailVerificationExpires;
      delete userResponse.passwordResetToken;
      delete userResponse.passwordResetExpires;

      return userResponse;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Update user data
      await user.update(updateData);

      // Remove sensitive data before returning
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.emailVerificationToken;
      delete userResponse.emailVerificationExpires;
      delete userResponse.passwordResetToken;
      delete userResponse.passwordResetExpires;

      logger.info(`Profile updated for user: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, token, firstName) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      await emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        template: 'emailVerification',
        data: {
          firstName,
          verificationUrl,
          expiresIn: '24 hours'
        }
      });

      logger.info(`Verification email sent to: ${email}`);
    } catch (error) {
      logger.error('Send verification email error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token, firstName) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      await emailService.sendEmail({
        to: email,
        subject: 'Reset Your Password',
        template: 'passwordReset',
        data: {
          firstName,
          resetUrl,
          expiresIn: '1 hour'
        }
      });

      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Send password reset email error:', error);
      throw error;
    }
  }

  /**
   * Check if user exists and is active
   */
  async checkUserExists(email) {
    try {
      const user = await User.findOne({ 
        where: { 
          email: email.toLowerCase(),
          isActive: true
        } 
      });
      return !!user;
    } catch (error) {
      logger.error('Check user exists error:', error);
      return false;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId, password) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Password is incorrect');
      }

      // Deactivate account
      await user.update({ isActive: false });

      // Clear any active sessions
      await redisUtils.deleteUserSessions(userId);

      logger.info(`Account deactivated for user: ${user.email}`);
      return { message: 'Account deactivated successfully' };
    } catch (error) {
      logger.error('Deactivate account error:', error);
      throw error;
    }
  }

  /**
   * Reactivate user account (admin only)
   */
  async reactivateAccount(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Reactivate account
      await user.update({ isActive: true });

      logger.info(`Account reactivated for user: ${user.email}`);
      return { message: 'Account reactivated successfully' };
    } catch (error) {
      logger.error('Reactivate account error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { isActive: true } });
      const verifiedUsers = await User.count({ where: { isVerified: true } });
      const adminUsers = await User.count({ where: { role: 'admin' } });
      const buyerUsers = await User.count({ where: { role: 'buyer' } });

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentRegistrations = await User.count({
        where: {
          createdAt: { [require('sequelize').Op.gte]: thirtyDaysAgo }
        }
      });

      return {
        totalUsers,
        activeUsers,
        verifiedUsers,
        adminUsers,
        buyerUsers,
        recentRegistrations
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
