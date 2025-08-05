const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const UserAddress = sequelize.define('UserAddress', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique address identifier'
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

  // Address type
  addressType: {
    type: DataTypes.ENUM('shipping', 'billing', 'both'),
    defaultValue: 'shipping',
    allowNull: false,
    comment: 'Type of address (shipping, billing, or both)'
  },

  // Address information
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
    comment: 'Recipient first name'
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
    comment: 'Recipient last name'
  },

  // Contact information
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[1-9][\d]{0,15}$/,
        msg: 'Please provide a valid phone number'
      }
    },
    comment: 'Contact phone number'
  },

  // Address details
  addressLine1: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Address line 1 is required'
      }
    },
    comment: 'Primary address line'
  },

  addressLine2: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Secondary address line (apartment, suite, etc.)'
  },

  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'City is required'
      }
    },
    comment: 'City name'
  },

  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'State/province is required'
      }
    },
    comment: 'State or province'
  },

  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Postal code is required'
      }
    },
    comment: 'Postal/ZIP code'
  },

  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'United States',
    validate: {
      notEmpty: {
        msg: 'Country is required'
      }
    },
    comment: 'Country name'
  },

  // Address status
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Default address for this type'
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Address active status'
  },

  // Address metadata
  label: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Address label (Home, Work, etc.)'
  },

  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional address notes'
  },

  // Validation and formatting
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Address verification status'
  },

  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Address verification timestamp'
  }

}, {
  // Table configuration
  tableName: 'user_addresses',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating an address
    beforeCreate: async (address) => {
      // Normalize address fields
      address.firstName = address.firstName.trim();
      address.lastName = address.lastName.trim();
      address.city = address.city.trim();
      address.state = address.state.trim();
      address.postalCode = address.postalCode.trim();
      address.country = address.country.trim();
      
      // If this is set as default, unset other defaults of the same type
      if (address.isDefault) {
        await UserAddress.update(
          { isDefault: false },
          {
            where: {
              userId: address.userId,
              addressType: address.addressType,
              isDefault: true
            }
          }
        );
      }
    },

    // Before updating an address
    beforeUpdate: async (address) => {
      // Normalize address fields if changed
      if (address.changed('firstName')) {
        address.firstName = address.firstName.trim();
      }
      if (address.changed('lastName')) {
        address.lastName = address.lastName.trim();
      }
      if (address.changed('city')) {
        address.city = address.city.trim();
      }
      if (address.changed('state')) {
        address.state = address.state.trim();
      }
      if (address.changed('postalCode')) {
        address.postalCode = address.postalCode.trim();
      }
      if (address.changed('country')) {
        address.country = address.country.trim();
      }
      
      // If this is set as default, unset other defaults of the same type
      if (address.changed('isDefault') && address.isDefault) {
        await UserAddress.update(
          { isDefault: false },
          {
            where: {
              userId: address.userId,
              addressType: address.addressType,
              isDefault: true,
              id: { [sequelize.Op.ne]: address.id }
            }
          }
        );
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      fields: ['user_id'],
      name: 'user_addresses_user_id_index'
    },
    {
      fields: ['address_type'],
      name: 'user_addresses_type_index'
    },
    {
      fields: ['is_default'],
      name: 'user_addresses_default_index'
    },
    {
      fields: ['is_active'],
      name: 'user_addresses_active_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Get full name
UserAddress.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

// Get formatted address
UserAddress.prototype.getFormattedAddress = function() {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.city,
    this.state,
    this.postalCode,
    this.country
  ].filter(part => part && part.trim());
  
  return parts.join(', ');
};

// Get address for shipping
UserAddress.prototype.getShippingAddress = function() {
  return {
    firstName: this.firstName,
    lastName: this.lastName,
    phone: this.phone,
    addressLine1: this.addressLine1,
    addressLine2: this.addressLine2,
    city: this.city,
    state: this.state,
    postalCode: this.postalCode,
    country: this.country
  };
};

// Check if address is for shipping
UserAddress.prototype.isShippingAddress = function() {
  return this.addressType === 'shipping' || this.addressType === 'both';
};

// Check if address is for billing
UserAddress.prototype.isBillingAddress = function() {
  return this.addressType === 'billing' || this.addressType === 'both';
};

// Set as default address
UserAddress.prototype.setAsDefault = async function() {
  // Unset other defaults of the same type
  await UserAddress.update(
    { isDefault: false },
    {
      where: {
        userId: this.userId,
        addressType: this.addressType,
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

// Verify address
UserAddress.prototype.verify = async function() {
  this.isVerified = true;
  this.verificationDate = new Date();
  await this.save();
  return this;
};

/**
 * Class Methods
 */

// Find addresses by user
UserAddress.findByUser = async function(userId) {
  return await this.findAll({
    where: { 
      userId: userId,
      isActive: true 
    },
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });
};

// Find default address by type
UserAddress.findDefaultByType = async function(userId, addressType) {
  return await this.findOne({
    where: { 
      userId: userId,
      addressType: addressType,
      isDefault: true,
      isActive: true 
    }
  });
};

// Find shipping addresses
UserAddress.findShippingAddresses = async function(userId) {
  return await this.findAll({
    where: { 
      userId: userId,
      addressType: { [sequelize.Op.in]: ['shipping', 'both'] },
      isActive: true 
    },
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });
};

// Find billing addresses
UserAddress.findBillingAddresses = async function(userId) {
  return await this.findAll({
    where: { 
      userId: userId,
      addressType: { [sequelize.Op.in]: ['billing', 'both'] },
      isActive: true 
    },
    order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
  });
};

// Create default address
UserAddress.createDefault = async function(userId, addressData, addressType = 'shipping') {
  // Unset existing defaults of the same type
  await this.update(
    { isDefault: false },
    {
      where: {
        userId: userId,
        addressType: addressType,
        isDefault: true
      }
    }
  );
  
  // Create new default address
  return await this.create({
    ...addressData,
    userId: userId,
    addressType: addressType,
    isDefault: true
  });
};

// Update default address
UserAddress.updateDefault = async function(userId, addressId, addressType) {
  // Unset existing defaults of the same type
  await this.update(
    { isDefault: false },
    {
      where: {
        userId: userId,
        addressType: addressType,
        isDefault: true,
        id: { [sequelize.Op.ne]: addressId }
      }
    }
  );
  
  // Set new default
  await this.update(
    { isDefault: true },
    {
      where: {
        id: addressId,
        userId: userId
      }
    }
  );
  
  return await this.findByPk(addressId);
};

// Validate address format
UserAddress.validateAddress = function(addressData) {
  const errors = [];
  
  if (!addressData.firstName || addressData.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }
  
  if (!addressData.lastName || addressData.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }
  
  if (!addressData.addressLine1 || addressData.addressLine1.trim().length === 0) {
    errors.push('Address line 1 is required');
  }
  
  if (!addressData.city || addressData.city.trim().length === 0) {
    errors.push('City is required');
  }
  
  if (!addressData.state || addressData.state.trim().length === 0) {
    errors.push('State/province is required');
  }
  
  if (!addressData.postalCode || addressData.postalCode.trim().length === 0) {
    errors.push('Postal code is required');
  }
  
  if (!addressData.country || addressData.country.trim().length === 0) {
    errors.push('Country is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = UserAddress;
