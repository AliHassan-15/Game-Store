const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique order identifier'
  },

  // Order number (human-readable)
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Human-readable order number'
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
    onDelete: 'RESTRICT',
    comment: 'Customer user ID'
  },

  // Order status
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Order status'
  },

  // Payment information
  paymentStatus: {
    type: DataTypes.ENUM(
      'pending',
      'paid',
      'failed',
      'refunded',
      'partially_refunded'
    ),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Payment status'
  },

  paymentMethod: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Payment method used'
  },

  paymentIntentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Stripe payment intent ID'
  },

  // Order totals
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Subtotal cannot be negative'
      }
    },
    comment: 'Order subtotal (before tax and shipping)'
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
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Total cannot be negative'
      }
    },
    comment: 'Order total'
  },

  // Shipping information
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Shipping address details'
  },

  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Billing address details (if different from shipping)'
  },

  // Shipping details
  shippingMethod: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Shipping method used'
  },

  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Shipping tracking number'
  },

  trackingUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Tracking URL must be a valid URL'
      }
    },
    comment: 'Shipping tracking URL'
  },

  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Estimated delivery date'
  },

  // Order metadata
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
    comment: 'Total number of items in order'
  },

  // Customer information
  customerEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address'
      }
    },
    comment: 'Customer email address'
  },

  customerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Customer phone number'
  },

  // Order notes
  customerNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Customer notes for the order'
  },

  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes for the order'
  },

  // Coupon information
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
  },

  // Timestamps for order lifecycle
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Order confirmation timestamp'
  },

  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Order processing timestamp'
  },

  shippedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Order shipped timestamp'
  },

  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Order delivery timestamp'
  },

  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Order cancellation timestamp'
  },

  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Order refund timestamp'
  }

}, {
  // Table configuration
  tableName: 'orders',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating an order
    beforeCreate: async (order) => {
      // Generate order number if not provided
      if (!order.orderNumber) {
        order.orderNumber = order.generateOrderNumber();
      }
      
      // Set customer email from user if not provided
      if (!order.customerEmail && order.userId) {
        const user = await sequelize.models.User.findByPk(order.userId);
        if (user) {
          order.customerEmail = user.email;
        }
      }
      
      // Calculate total if not provided
      if (!order.total) {
        order.total = order.calculateTotal();
      }
    },

    // Before updating an order
    beforeUpdate: async (order) => {
      // Update status timestamps
      if (order.changed('status')) {
        const now = new Date();
        
        switch (order.status) {
          case 'confirmed':
            order.confirmedAt = now;
            break;
          case 'processing':
            order.processedAt = now;
            break;
          case 'shipped':
            order.shippedAt = now;
            break;
          case 'delivered':
            order.deliveredAt = now;
            break;
          case 'cancelled':
            order.cancelledAt = now;
            break;
          case 'refunded':
            order.refundedAt = now;
            break;
        }
      }
      
      // Recalculate total if amounts changed
      if (order.changed('subtotal') || order.changed('taxAmount') || 
          order.changed('shippingAmount') || order.changed('discountAmount') ||
          order.changed('couponDiscount')) {
        order.total = order.calculateTotal();
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['order_number'],
      name: 'orders_order_number_unique'
    },
    {
      fields: ['user_id'],
      name: 'orders_user_id_index'
    },
    {
      fields: ['status'],
      name: 'orders_status_index'
    },
    {
      fields: ['payment_status'],
      name: 'orders_payment_status_index'
    },
    {
      fields: ['created_at'],
      name: 'orders_created_at_index'
    },
    {
      fields: ['customer_email'],
      name: 'orders_customer_email_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Generate unique order number
Order.prototype.generateOrderNumber = function() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Calculate order total
Order.prototype.calculateTotal = function() {
  const subtotal = parseFloat(this.subtotal || 0);
  const taxAmount = parseFloat(this.taxAmount || 0);
  const shippingAmount = parseFloat(this.shippingAmount || 0);
  const discountAmount = parseFloat(this.discountAmount || 0);
  const couponDiscount = parseFloat(this.couponDiscount || 0);
  
  return Math.max(0, subtotal + taxAmount + shippingAmount - discountAmount - couponDiscount);
};

// Get order with items
Order.prototype.getWithItems = async function() {
  const items = await this.getOrderItems({
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      attributes: ['id', 'name', 'slug', 'mainImage', 'sku']
    }],
    order: [['createdAt', 'ASC']]
  });
  
  return {
    ...this.toJSON(),
    items: items
  };
};

// Get order with full details
Order.prototype.getWithFullDetails = async function() {
  const items = await this.getOrderItems({
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      include: [{
        model: sequelize.models.Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }]
    }],
    order: [['createdAt', 'ASC']]
  });
  
  const user = await this.getUser({
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
  });
  
  return {
    ...this.toJSON(),
    items: items,
    user: user
  };
};

// Check if order can be cancelled
Order.prototype.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  return cancellableStatuses.includes(this.status);
};

// Check if order can be refunded
Order.prototype.canBeRefunded = function() {
  return this.paymentStatus === 'paid' && this.status !== 'refunded';
};

// Check if order is completed
Order.prototype.isCompleted = function() {
  return this.status === 'delivered';
};

// Check if order is cancelled
Order.prototype.isCancelled = function() {
  return this.status === 'cancelled';
};

// Get order status display name
Order.prototype.getStatusDisplay = function() {
  const statusMap = {
    'pending': 'Pending',
    'confirmed': 'Confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };
  
  return statusMap[this.status] || this.status;
};

// Get payment status display name
Order.prototype.getPaymentStatusDisplay = function() {
  const statusMap = {
    'pending': 'Pending',
    'paid': 'Paid',
    'failed': 'Failed',
    'refunded': 'Refunded',
    'partially_refunded': 'Partially Refunded'
  };
  
  return statusMap[this.paymentStatus] || this.paymentStatus;
};

// Update order status
Order.prototype.updateStatus = async function(newStatus) {
  this.status = newStatus;
  await this.save();
  return this;
};

// Update payment status
Order.prototype.updatePaymentStatus = async function(newPaymentStatus) {
  this.paymentStatus = newPaymentStatus;
  await this.save();
  return this;
};

// Add tracking information
Order.prototype.addTracking = async function(trackingNumber, trackingUrl, estimatedDelivery) {
  this.trackingNumber = trackingNumber;
  this.trackingUrl = trackingUrl;
  this.estimatedDelivery = estimatedDelivery;
  await this.save();
  return this;
};

/**
 * Class Methods
 */

// Find order by order number
Order.findByOrderNumber = async function(orderNumber) {
  return await this.findOne({
    where: { orderNumber: orderNumber }
  });
};

// Find orders by user
Order.findByUser = async function(userId, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { userId: userId },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find orders by status
Order.findByStatus = async function(status, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { status: status },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find orders by payment status
Order.findByPaymentStatus = async function(paymentStatus, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { paymentStatus: paymentStatus },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find orders by customer email
Order.findByCustomerEmail = async function(email, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { customerEmail: email },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find recent orders
Order.findRecentOrders = async function(limit = 10) {
  return await this.findAll({
    limit: limit,
    order: [['createdAt', 'DESC']]
  });
};

// Find orders with items
Order.findWithItems = async function(limit = 20, offset = 0) {
  return await this.findAndCountAll({
    include: [{
      model: sequelize.models.OrderItem,
      as: 'orderItems',
      include: [{
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'mainImage']
      }]
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Get order statistics
Order.getStatistics = async function() {
  const totalOrders = await this.count();
  const pendingOrders = await this.count({ where: { status: 'pending' } });
  const processingOrders = await this.count({ where: { status: 'processing' } });
  const shippedOrders = await this.count({ where: { status: 'shipped' } });
  const deliveredOrders = await this.count({ where: { status: 'delivered' } });
  const cancelledOrders = await this.count({ where: { status: 'cancelled' } });
  
  const totalRevenue = await this.sum('total', {
    where: { 
      status: { [sequelize.Op.in]: ['delivered', 'shipped'] },
      paymentStatus: 'paid'
    }
  });
  
  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue: parseFloat(totalRevenue || 0)
  };
};

// Search orders
Order.searchOrders = async function(searchTerm, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: {
      [sequelize.Op.or]: [
        { orderNumber: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { customerEmail: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
        { trackingNumber: { [sequelize.Op.iLike]: `%${searchTerm}%` } }
      ]
    },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

module.exports = Order;
