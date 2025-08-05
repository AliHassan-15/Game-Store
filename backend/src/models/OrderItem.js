const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique order item identifier'
  },

  // Order relationship
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Order ID'
  },

  // Product relationship
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    comment: 'Product ID'
  },

  // Quantity
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Quantity must be at least 1'
      }
    },
    comment: 'Item quantity'
  },

  // Price at time of order (price snapshot)
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Unit price cannot be negative'
      }
    },
    comment: 'Product price when order was placed'
  },

  // Item total
  itemTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Item total cannot be negative'
      }
    },
    comment: 'Total price for this item (unit price * quantity)'
  },

  // Product information snapshot
  productSnapshot: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Product information at time of order'
  },

  // Additional options
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional item options'
  },

  // Item status
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Item status'
  },

  // Refund information
  refundedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Refunded quantity cannot be negative'
      }
    },
    comment: 'Quantity refunded for this item'
  },

  refundedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Refunded amount cannot be negative'
      }
    },
    comment: 'Amount refunded for this item'
  },

  // Notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Item-specific notes'
  }

}, {
  // Table configuration
  tableName: 'order_items',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating an order item
    beforeCreate: async (orderItem) => {
      // Get product information
      const product = await sequelize.models.Product.findByPk(orderItem.productId);
      if (product) {
        // Set unit price
        orderItem.unitPrice = parseFloat(product.price);
        
        // Calculate item total
        orderItem.itemTotal = orderItem.unitPrice * orderItem.quantity;
        
        // Create product snapshot
        orderItem.productSnapshot = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          mainImage: product.mainImage,
          category: product.categoryId,
          subCategory: product.subCategoryId,
          platform: product.platform,
          genre: product.genre,
          publisher: product.publisher,
          developer: product.developer
        };
      }
    },

    // Before updating an order item
    beforeUpdate: async (orderItem) => {
      // Recalculate item total if quantity changed
      if (orderItem.changed('quantity')) {
        orderItem.itemTotal = orderItem.unitPrice * orderItem.quantity;
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      fields: ['order_id'],
      name: 'order_items_order_id_index'
    },
    {
      fields: ['product_id'],
      name: 'order_items_product_id_index'
    },
    {
      fields: ['status'],
      name: 'order_items_status_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Get order item with product details
OrderItem.prototype.getWithProduct = async function() {
  const product = await this.getProduct();
  
  return {
    ...this.toJSON(),
    product: product
  };
};

// Get order item with full details
OrderItem.prototype.getWithFullDetails = async function() {
  const product = await this.getProduct({
    include: [{
      model: sequelize.models.Category,
      as: 'category',
      attributes: ['id', 'name', 'slug']
    }]
  });
  
  return {
    ...this.toJSON(),
    product: product
  };
};

// Check if item is fully refunded
OrderItem.prototype.isFullyRefunded = function() {
  return this.refundedQuantity >= this.quantity;
};

// Check if item is partially refunded
OrderItem.prototype.isPartiallyRefunded = function() {
  return this.refundedQuantity > 0 && this.refundedQuantity < this.quantity;
};

// Check if item can be refunded
OrderItem.prototype.canBeRefunded = function() {
  return this.status !== 'cancelled' && this.refundedQuantity < this.quantity;
};

// Get remaining quantity (not refunded)
OrderItem.prototype.getRemainingQuantity = function() {
  return this.quantity - this.refundedQuantity;
};

// Get remaining amount (not refunded)
OrderItem.prototype.getRemainingAmount = function() {
  const remainingQuantity = this.getRemainingQuantity();
  return (this.unitPrice * remainingQuantity);
};

// Update item status
OrderItem.prototype.updateStatus = async function(newStatus) {
  this.status = newStatus;
  await this.save();
  return this;
};

// Process refund
OrderItem.prototype.processRefund = async function(refundQuantity, refundAmount) {
  if (refundQuantity > this.getRemainingQuantity()) {
    throw new Error('Refund quantity exceeds remaining quantity');
  }
  
  this.refundedQuantity += refundQuantity;
  this.refundedAmount += refundAmount;
  
  // Update status if fully refunded
  if (this.isFullyRefunded()) {
    this.status = 'refunded';
  }
  
  await this.save();
  return this;
};

/**
 * Class Methods
 */

// Find order items by order
OrderItem.findByOrder = async function(orderId) {
  return await this.findAll({
    where: { orderId: orderId },
    order: [['createdAt', 'ASC']]
  });
};

// Find order items with product details
OrderItem.findWithProducts = async function(orderId) {
  return await this.findAll({
    where: { orderId: orderId },
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
};

// Find order items by status
OrderItem.findByStatus = async function(status, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { status: status },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find order items by product
OrderItem.findByProduct = async function(productId, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { productId: productId },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Get order item statistics
OrderItem.getStatistics = async function() {
  const totalItems = await this.count();
  const pendingItems = await this.count({ where: { status: 'pending' } });
  const shippedItems = await this.count({ where: { status: 'shipped' } });
  const deliveredItems = await this.count({ where: { status: 'delivered' } });
  const cancelledItems = await this.count({ where: { status: 'cancelled' } });
  const refundedItems = await this.count({ where: { status: 'refunded' } });
  
  const totalRevenue = await this.sum('itemTotal', {
    where: { 
      status: { [sequelize.Op.in]: ['delivered', 'shipped'] }
    }
  });
  
  const totalRefunds = await this.sum('refundedAmount');
  
  return {
    totalItems,
    pendingItems,
    shippedItems,
    deliveredItems,
    cancelledItems,
    refundedItems,
    totalRevenue: parseFloat(totalRevenue || 0),
    totalRefunds: parseFloat(totalRefunds || 0)
  };
};

// Create order items from cart
OrderItem.createFromCart = async function(orderId, cartItems) {
  const orderItems = [];
  
  for (const cartItem of cartItems) {
    const orderItem = await this.create({
      orderId: orderId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      unitPrice: cartItem.priceAtAdd,
      itemTotal: cartItem.itemTotal,
      options: cartItem.options || {},
      productSnapshot: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        slug: cartItem.product.slug,
        sku: cartItem.product.sku,
        mainImage: cartItem.product.mainImage,
        category: cartItem.product.categoryId,
        subCategory: cartItem.product.subCategoryId,
        platform: cartItem.product.platform,
        genre: cartItem.product.genre,
        publisher: cartItem.product.publisher,
        developer: cartItem.product.developer
      }
    });
    
    orderItems.push(orderItem);
  }
  
  return orderItems;
};

module.exports = OrderItem;
