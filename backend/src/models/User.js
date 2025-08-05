const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

/**
 * User Model - Represents users in the system (Admin/Buyer)
 * 
 * This model handles:
 * - User authentication (email/password + Google OAuth)
 * - User roles (admin/buyer)
 * - User profile information
 * - Account verification and status
 * - Password management with bcrypt hashing
 */
const User = sequelize.define('User', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique user identifier'
  },

  // Authentication fields
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    },
    comment: 'User email address (unique)'
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // Allow null for OAuth users
    validate: {
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters long'
      }
    },
    comment: 'Hashed password (null for OAuth users)'
  },

  // Personal information
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'First name is required'
      },
      len: {
        args: [2, 100],
        msg: 'First name must be between 2 and 100 characters'
      }
    },
    comment: 'User first name'
  },

  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Last name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Last name must be between 2 and 100 characters'
      }
    },
    comment: 'User last name'
  },

  // Role and permissions
  role: {
    type: DataTypes.ENUM('admin', 'buyer'),
    defaultValue: 'buyer',
    allowNull: false,
    validate: {
      isIn: {
        args: [['admin', 'buyer']],
        msg: 'Role must be either admin or buyer'
      }
    },
    comment: 'User role (admin or buyer)'
  },

  // OAuth integration
  googleId: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
    comment: 'Google OAuth ID (for social login)'
  },

  // Profile information
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Avatar must be a valid URL'
      }
    },
    comment: 'User profile picture URL'
  },

  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[1-9][\d]{0,15}$/,
        msg: 'Please provide a valid phone number'
      }
    },
    comment: 'User phone number'
  },

  // Account status
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Email verification status'
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Account active status'
  },

  // Activity tracking
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last login timestamp'
  },

  // Email verification
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Token for email verification'
  },

  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Email verification token expiration'
  },

  // Password reset
  passwordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Token for password reset'
  },

  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Password reset token expiration'
  }

}, {
  // Table configuration
  tableName: 'users',
  timestamps: true, // Adds createdAt and updatedAt
  underscored: true, // Uses snake_case for column names

  // Model hooks (lifecycle events)
  hooks: {
    // Before creating a new user
    beforeCreate: async (user) => {
      // Hash password if provided
      if (user.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
      
      // Normalize email to lowercase
      user.email = user.email.toLowerCase();
    },

    // Before updating a user
    beforeUpdate: async (user) => {
      // Hash password if it was changed
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
      
      // Normalize email to lowercase if changed
      if (user.changed('email')) {
        user.email = user.email.toLowerCase();
      }
    }
  }
});

/**
 * Instance Methods - Available on user instances
 */

// Compare password with hashed password
User.prototype.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      return false; // OAuth users don't have passwords
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Get user's full name
User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

// Check if user is admin
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

// Check if user is buyer
User.prototype.isBuyer = function() {
  return this.role === 'buyer';
};

// Check if user can login (active and verified)
User.prototype.canLogin = function() {
  return this.isActive && (this.isVerified || this.googleId);
};

// Generate email verification token
User.prototype.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.emailVerificationToken;
};

// Generate password reset token
User.prototype.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return this.passwordResetToken;
};

// Clear sensitive data when converting to JSON
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Remove sensitive fields
  delete values.password;
  delete values.emailVerificationToken;
  delete values.emailVerificationExpires;
  delete values.passwordResetToken;
  delete values.passwordResetExpires;
  
  return values;
};

/**
 * Class Methods - Available on User model
 */

// Find user by email
User.findByEmail = async function(email) {
  return await this.findOne({
    where: { email: email.toLowerCase() }
  });
};

// Find user by Google ID
User.findByGoogleId = async function(googleId) {
  return await this.findOne({
    where: { googleId: googleId }
  });
};

// Find active users
User.findActiveUsers = async function() {
  return await this.findAll({
    where: { isActive: true }
  });
};

// Find users by role
User.findByRole = async function(role) {
  return await this.findAll({
    where: { role: role }
  });
};

module.exports = User;
