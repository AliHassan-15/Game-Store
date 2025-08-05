const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const UserPayment = sequelize.define('UserPayment', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique payment method identifier'
  },

  // User relationship
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'User ID'
  },

  // Payment method type
  paymentType: {
    type: DataTypes.ENUM('card', 'bank_account', 'wallet'),
    defaultValue: 'card',
    allowNull: false,
    comment: 'Type of payment method'
  },

  // Stripe payment method ID
  stripePaymentMethodId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Stripe payment method ID'
  },

  // Stripe customer ID
  stripeCustomerId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Stripe customer ID'
  },

  // Payment method details (masked for security)
  cardBrand: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Card brand (Visa, Mastercard, etc.)'
  },

  cardLast4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    validate: {
      len: {
        args: [4, 4],
        msg: 'Card last 4 digits must be exactly 4 characters'
      }
    },
    comment: 'Last 4 digits of the card'
  },

  cardExpMonth: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [1],
        msg: 'Expiration month must be between 1 and 12'
      },
      max: {
        args: [12],
        msg: 'Expiration month must be between 1 and 12'
      }
    },
    comment: 'Card expiration month'
  },

  cardExpYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [new Date().getFullYear()],
        msg: 'Expiration year cannot be in the past'
      }
    },
    comment: 'Card expiration year'
  },

  // Billing address
  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Billing address for this payment method'
  },

  // Payment method status
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Default payment method for this user'
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Payment method active status'
  },

  // Payment method metadata
  label: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Payment method label (My Visa, Work Card, etc.)'
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional payment method notes'
  },

  // Security and validation
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Payment method verification status'
  },

  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Payment method verification timestamp'
  },

  // Usage tracking
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this payment method was used'
  },

  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Usage count cannot be negative'
      }
    },
    comment: 'Number of times this payment method was used'
  }

}, {
  // Table configuration
  tableName: 'user_payments',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a payment method
    beforeCreate: async (paymentMethod) => {
      // If this is set as default, unset other defaults
      if (paymentMethod.isDefault) {
        await UserPayment.update(
          { isDefault: false },
          {
            where: {
              userId: paymentMethod.userId,
              isDefault: true
            }
          }
        );
      }
    },

    // Before updating a payment method
    beforeUpdate: async (paymentMethod) => {
      // If this is set as default, unset other defaults
      if (paymentMethod.changed('isDefault') && paymentMethod.isDefault) {
        await UserPayment.update(
          { isDefault: false },
          {
            where: {
              userId: paymentMethod.userId,
              isDefault: true,
              id: { [sequelize.Op.ne]: paymentMethod.id }
            }
          }
        );
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['stripe_payment_method_id'],
      name: 'user_payments_stripe_payment_method_id_unique'
    },
    {
      fields: ['user_id'],
      name: 'user_payments_user_id_index'
    },
    {
      fields: ['stripe_customer_id'],
      name: 'user_payments_stripe_customer_id_index'
    },
    {
      fields: ['payment_type'],
      name: 'user_payments_type_index'
    },
    {
      fields: ['is_default'],
      name: 'user_payments_default_index'
    },
    {
      fields: ['is_active'],
      name: 'user_payments_active_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Get masked card number
UserPayment.prototype.getMaskedCardNumber = function() {
  if (this.cardLast4) {
    return `**** **** **** ${this.cardLast4}`;
  }
  return '**** **** **** ****';
};

// Get card expiration
UserPayment.prototype.getCardExpiration = function() {
  if (this.cardExpMonth && this.cardExpYear) {
    return `${this.cardExpMonth.toString().padStart(2, '0')}/${this.cardExpYear}`;
  }
  return null;
};

// Check if card is expired
UserPayment.prototype.isExpired = function() {
  if (!this.cardExpMonth || !this.cardExpYear) {
    return false;
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  
  if (this.cardExpYear < currentYear) {
    return true;
  }
  
  if (this.cardExpYear === currentYear && this.cardExpMonth < currentMonth) {
    return true;
  }
  
  return false;
};

// Get payment method display name
UserPayment.prototype.getDisplayName = function() {
  if (this.label) {
    return this.label;
  }
  
  if (this.paymentType === 'card' && this.cardBrand && this.cardLast4) {
    return `${this.cardBrand} ending in ${this.cardLast4}`;
  }
  
  return `${this.paymentType} payment method`;
};

// Set as default payment method
UserPayment.prototype.setAsDefault = async function() {
  // Unset other defaults
  await UserPayment.update(
    { isDefault: false },
    {
      where: {
        userId: this.userId,
        isDefault: true,
        id: { [sequelize.Op.ne]: this.id }
      }
    }
  );
  
  // Set this as default
  this.isDefault = true;
  await this.save();
  return this;
};

// Mark as used
UserPayment.prototype.markAsUsed = async function() {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  await this.save();
  return this;
};

// Verify payment method
UserPayment.prototype.verify = async function() {
  this.isVerified = true;
  this.verificationDate = new Date();
  await this.save();
  return this;
};

// Get payment method for Stripe
UserPayment.prototype.getStripeData = function() {
  return {
    paymentMethodId: this.stripePaymentMethodId,
    customerId: this.stripeCustomerId,
    billingDetails: this.billingAddress
  };
};

/**
 * Class Methods
 */

// Find payment methods by user
UserPayment.findByUser = async function(userId) {
  return await this.findAll({
    where: { 
      userId: userId,
      isActive: true 
    },
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });
};

// Find default payment method
UserPayment.findDefault = async function(userId) {
  return await this.findOne({
    where: { 
      userId: userId,
      isDefault: true,
      isActive: true 
    }
  });
};

// Find payment method by Stripe ID
UserPayment.findByStripeId = async function(stripePaymentMethodId) {
  return await this.findOne({
    where: { stripePaymentMethodId: stripePaymentMethodId }
  });
};

// Find payment methods by customer
UserPayment.findByCustomer = async function(stripeCustomerId) {
  return await this.findAll({
    where: { 
      stripeCustomerId: stripeCustomerId,
      isActive: true 
    },
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });
};

// Create default payment method
UserPayment.createDefault = async function(userId, paymentData) {
  // Unset existing defaults
  await this.update(
    { isDefault: false },
    {
      where: {
        userId: userId,
        isDefault: true
      }
    }
  );
  
  // Create new default payment method
  return await this.create({
    ...paymentData,
    userId: userId,
    isDefault: true
  });
};

// Update default payment method
UserPayment.updateDefault = async function(userId, paymentMethodId) {
  // Unset existing defaults
  await this.update(
    { isDefault: false },
    {
      where: {
        userId: userId,
        isDefault: true,
        id: { [sequelize.Op.ne]: paymentMethodId }
      }
    }
  );
  
  // Set new default
  await this.update(
    { isDefault: true },
    {
      where: {
        id: paymentMethodId,
        userId: userId
      }
    }
  );
  
  return await this.findByPk(paymentMethodId);
};

// Validate payment method data
UserPayment.validatePaymentData = function(paymentData) {
  const errors = [];
  
  if (!paymentData.stripePaymentMethodId) {
    errors.push('Stripe payment method ID is required');
  }
  
  if (!paymentData.paymentType) {
    errors.push('Payment type is required');
  }
  
  if (paymentData.paymentType === 'card') {
    if (!paymentData.cardLast4) {
      errors.push('Card last 4 digits are required');
    }
    
    if (!paymentData.cardExpMonth || !paymentData.cardExpYear) {
      errors.push('Card expiration date is required');
    }
    
    if (paymentData.cardExpMonth && (paymentData.cardExpMonth < 1 || paymentData.cardExpMonth > 12)) {
      errors.push('Invalid expiration month');
    }
    
    if (paymentData.cardExpYear && paymentData.cardExpYear < new Date().getFullYear()) {
      errors.push('Card expiration year cannot be in the past');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Get payment method statistics
UserPayment.getStatistics = async function(userId = null) {
  const whereClause = {};
  if (userId) {
    whereClause.userId = userId;
  }
  
  const totalPaymentMethods = await this.count({ where: whereClause });
  const activePaymentMethods = await this.count({ where: { ...whereClause, isActive: true } });
  const defaultPaymentMethods = await this.count({ where: { ...whereClause, isDefault: true } });
  const verifiedPaymentMethods = await this.count({ where: { ...whereClause, isVerified: true } });
  
  const cardPaymentMethods = await this.count({ 
    where: { ...whereClause, paymentType: 'card' } 
  });
  
  const bankPaymentMethods = await this.count({ 
    where: { ...whereClause, paymentType: 'bank_account' } 
  });
  
  return {
    totalPaymentMethods,
    activePaymentMethods,
    defaultPaymentMethods,
    verifiedPaymentMethods,
    cardPaymentMethods,
    bankPaymentMethods
  };
};

module.exports = UserPayment;
