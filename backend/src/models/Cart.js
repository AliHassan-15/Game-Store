const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Cart Model - Represents user shopping carts
 * 
 * This model handles:
 * - User shopping cart management
 * - Cart items and quantities
 * - Cart totals and calculations
 * - Cart expiration and cleanup
 * - Guest cart support
 */
const Cart = sequelize.define('Cart', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique cart identifier'
  },

  // User relationship
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow null for guest carts
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'User ID (null for guest carts)'
  },

  // Guest cart support
  guestId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Guest session ID for anonymous carts'
  },

  // Cart status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Cart active status'
  },

  // Cart totals (calculated fields)
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Subtotal cannot be negative'
      }
    },
    comment: 'Cart subtotal (before tax and shipping)'
  },

  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Tax amount cannot be negative'
      }
    },
    comment: 'Tax amount'
  },

  shippingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Shipping amount cannot be negative'
      }
    },
    comment: 'Shipping cost'
  },

  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Discount amount cannot be negative'
      }
    },
    comment: 'Discount amount'
  },

  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Total cannot be negative'
      }
    },
    comment: 'Cart total (subtotal + tax + shipping - discount)'
  },

  // Cart metadata
  itemCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Item count cannot be negative'
      }
    },
    comment: 'Total number of items in cart'
  },

  // Cart expiration
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Cart expiration date (for cleanup)'
  },

  // Additional data
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Cart notes or special instructions'
  },

  // Coupon/discount
  couponCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Applied coupon code'
  },

  couponDiscount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Coupon discount cannot be negative'
      }
    },
    comment: 'Coupon discount amount'
  }

}, {
  // Table configuration
  tableName: 'carts',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a cart
    beforeCreate: async (cart) => {
      // Set expiration date for guest carts (30 days)
      if (!cart.userId && !cart.expiresAt) {
        cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    },

    // Before updating a cart
    beforeUpdate: async (cart) => {
      // Recalculate totals if any amount fields changed
      if (cart.changed('subtotal') || cart.changed('taxAmount') || 
          cart.changed('shippingAmount') || cart.changed('discountAmount') ||
          cart.changed('couponDiscount')) {
        cart.total = cart.calculateTotal();
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      fields: ['user_id'],
      name: 'carts_user_id_index'
    },
    {
      fields: ['guest_id'],
      name: 'carts_guest_id_index'
    },
    {
      fields: ['is_active'],
      name: 'carts_active_index'
    },
    {
      fields: ['expires_at'],
      name: 'carts_expires_at_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Calculate cart total
Cart.prototype.calculateTotal = function() {
  const subtotal = parseFloat(this.subtotal || 0);
  const taxAmount = parseFloat(this.taxAmount || 0);
  const shippingAmount = parseFloat(this.shippingAmount || 0);
  const discountAmount = parseFloat(this.discountAmount || 0);
  const couponDiscount = parseFloat(this.couponDiscount || 0);
  
  return Math.max(0, subtotal + taxAmount + shippingAmount - discountAmount - couponDiscount);
};

// Get cart with items
Cart.prototype.getWithItems = async function() {
  const items = await this.getCartItems({
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      where: { isActive: true },
      required: true
    }],
    order: [['createdAt', 'ASC']]
  });
  
  return {
    ...this.toJSON(),
    items: items
  };
};

// Get cart with items and product details
Cart.prototype.getWithFullDetails = async function() {
  const items = await this.getCartItems({
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      where: { isActive: true },
      required: true,
      include: [{
        model: sequelize.models.Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }]
    }],
    order: [['createdAt', 'ASC']]
  });
  
  return {
    ...this.toJSON(),
    items: items
  };
};

// Check if cart is empty
Cart.prototype.isEmpty = function() {
  return this.itemCount === 0;
};

// Check if cart has items
Cart.prototype.hasItems = function() {
  return this.itemCount > 0;
};

// Check if cart is expired
Cart.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Check if cart can be converted to order
Cart.prototype.canBeOrdered = function() {
  return this.isActive && !this.isEmpty() && !this.isExpired();
};

// Clear cart
Cart.prototype.clear = async function() {
  // Delete all cart items
  await this.setCartItems([]);
  
  // Reset totals
  this.subtotal = 0.00;
  this.taxAmount = 0.00;
  this.shippingAmount = 0.00;
  this.discountAmount = 0.00;
  this.couponDiscount = 0.00;
  this.total = 0.00;
  this.itemCount = 0;
  this.couponCode = null;
  
  await this.save();
};

// Apply coupon
Cart.prototype.applyCoupon = async function(couponCode, discountAmount) {
  this.couponCode = couponCode;
  this.couponDiscount = discountAmount;
  this.total = this.calculateTotal();
  await this.save();
};

// Remove coupon
Cart.prototype.removeCoupon = async function() {
  this.couponCode = null;
  this.couponDiscount = 0.00;
  this.total = this.calculateTotal();
  await this.save();
};

// Update cart totals
Cart.prototype.updateTotals = async function() {
  const items = await this.getCartItems({
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      where: { isActive: true },
      required: true
    }]
  });
  
  let subtotal = 0.00;
  let itemCount = 0;
  
  for (const item of items) {
    const itemTotal = parseFloat(item.product.price) * item.quantity;
    subtotal += itemTotal;
    itemCount += item.quantity;
  }
  
  this.subtotal = subtotal;
  this.itemCount = itemCount;
  this.total = this.calculateTotal();
  
  await this.save();
};

/**
 * Class Methods
 */

// Find cart by user ID
Cart.findByUserId = async function(userId) {
  return await this.findOne({
    where: { 
      userId: userId,
      isActive: true 
    }
  });
};

// Find cart by guest ID
Cart.findByGuestId = async function(guestId) {
  return await this.findOne({
    where: { 
      guestId: guestId,
      isActive: true 
    }
  });
};

// Find or create cart for user
Cart.findOrCreateForUser = async function(userId) {
  const [cart, created] = await this.findOrCreate({
    where: { 
      userId: userId,
      isActive: true 
    },
    defaults: {
      userId: userId,
      isActive: true
    }
  });
  
  return cart;
};

// Find or create cart for guest
Cart.findOrCreateForGuest = async function(guestId) {
  const [cart, created] = await this.findOrCreate({
    where: { 
      guestId: guestId,
      isActive: true 
    },
    defaults: {
      guestId: guestId,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });
  
  return cart;
};

// Find expired carts
Cart.findExpiredCarts = async function() {
  return await this.findAll({
    where: {
      expiresAt: {
        [sequelize.Op.lt]: new Date()
      },
      isActive: true
    }
  });
};

// Clean up expired carts
Cart.cleanupExpiredCarts = async function() {
  const expiredCarts = await this.findExpiredCarts();
  
  for (const cart of expiredCarts) {
    cart.isActive = false;
    await cart.save();
  }
  
  return expiredCarts.length;
};

// Merge guest cart with user cart
Cart.mergeGuestCart = async function(guestId, userId) {
  const guestCart = await this.findByGuestId(guestId);
  const userCart = await this.findByUserId(userId);
  
  if (!guestCart || guestCart.isEmpty()) {
    return userCart;
  }
  
  if (!userCart) {
    // Create new user cart and transfer guest cart items
    guestCart.userId = userId;
    guestCart.guestId = null;
    await guestCart.save();
    return guestCart;
  }
  
  // Merge items from guest cart to user cart
  const guestItems = await guestCart.getCartItems();
  
  for (const guestItem of guestItems) {
    const existingItem = await userCart.getCartItems({
      where: { productId: guestItem.productId }
    });
    
    if (existingItem.length > 0) {
      // Update quantity
      existingItem[0].quantity += guestItem.quantity;
      await existingItem[0].save();
    } else {
      // Add new item
      await userCart.addCartItem(guestItem.productId, {
        quantity: guestItem.quantity
      });
    }
  }
  
  // Update user cart totals
  await userCart.updateTotals();
  
  // Deactivate guest cart
  guestCart.isActive = false;
  await guestCart.save();
  
  return userCart;
};

module.exports = Cart;
