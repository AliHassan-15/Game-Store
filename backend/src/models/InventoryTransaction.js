const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * InventoryTransaction Model - Tracks inventory changes and stock movements
 * 
 * This model handles:
 * - Stock additions and removals
 * - Inventory adjustments and corrections
 * - Stock movement history and audit trail
 * - Inventory analytics and reporting
 */
const InventoryTransaction = sequelize.define('InventoryTransaction', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique transaction identifier'
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
    onDelete: 'CASCADE',
    comment: 'Product ID'
  },

  // User who performed the transaction
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'User who performed the transaction'
  },

  // Transaction type
  transactionType: {
    type: DataTypes.ENUM(
      'stock_in',
      'stock_out',
      'adjustment',
      'correction',
      'return',
      'damaged',
      'expired',
      'transfer'
    ),
    allowNull: false,
    comment: 'Type of inventory transaction'
  },

  // Quantity change
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Quantity change (positive for additions, negative for removals)'
  },

  // Stock before transaction
  stockBefore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Stock before cannot be negative'
      }
    },
    comment: 'Stock quantity before transaction'
  },

  // Stock after transaction
  stockAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Stock after cannot be negative'
      }
    },
    comment: 'Stock quantity after transaction'
  },

  // Reference information
  referenceType: {
    type: DataTypes.ENUM(
      'order',
      'manual',
      'system',
      'return',
      'transfer',
      'adjustment'
    ),
    allowNull: false,
    comment: 'Type of reference for this transaction'
  },

  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Reference ID (order ID, etc.)'
  },

  referenceNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Human-readable reference number'
  },

  // Transaction details
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Reason for the transaction'
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the transaction'
  },

  // Cost information
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Unit cost cannot be negative'
      }
    },
    comment: 'Unit cost for this transaction'
  },

  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Total cost cannot be negative'
      }
    },
    comment: 'Total cost for this transaction'
  },

  // Location information
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Location where transaction occurred'
  },

  // Additional data
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional transaction metadata'
  },

  // Transaction status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Transaction active status'
  }

}, {
  // Table configuration
  tableName: 'inventory_transactions',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a transaction
    beforeCreate: async (transaction) => {
      // Get current product stock
      const product = await sequelize.models.Product.findByPk(transaction.productId);
      if (product) {
        transaction.stockBefore = product.stockQuantity;
        transaction.stockAfter = product.stockQuantity + transaction.quantity;
        
        // Calculate total cost if unit cost is provided
        if (transaction.unitCost && transaction.quantity > 0) {
          transaction.totalCost = transaction.unitCost * Math.abs(transaction.quantity);
        }
      }
    },

    // After creating a transaction
    afterCreate: async (transaction) => {
      // Update product stock
      const product = await sequelize.models.Product.findByPk(transaction.productId);
      if (product) {
        await product.update({ stockQuantity: transaction.stockAfter });
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      fields: ['product_id'],
      name: 'inventory_transactions_product_id_index'
    },
    {
      fields: ['user_id'],
      name: 'inventory_transactions_user_id_index'
    },
    {
      fields: ['transaction_type'],
      name: 'inventory_transactions_type_index'
    },
    {
      fields: ['reference_type', 'reference_id'],
      name: 'inventory_transactions_reference_index'
    },
    {
      fields: ['created_at'],
      name: 'inventory_transactions_created_at_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Get transaction with product details
InventoryTransaction.prototype.getWithProduct = async function() {
  const product = await this.getProduct({
    attributes: ['id', 'name', 'slug', 'sku', 'mainImage']
  });
  
  return {
    ...this.toJSON(),
    product: product
  };
};

// Get transaction with user details
InventoryTransaction.prototype.getWithUser = async function() {
  const user = await this.getUser({
    attributes: ['id', 'firstName', 'lastName', 'email']
  });
  
  return {
    ...this.toJSON(),
    user: user
  };
};

// Get transaction with full details
InventoryTransaction.prototype.getWithFullDetails = async function() {
  const product = await this.getProduct({
    attributes: ['id', 'name', 'slug', 'sku', 'mainImage']
  });
  
  const user = await this.getUser({
    attributes: ['id', 'firstName', 'lastName', 'email']
  });
  
  return {
    ...this.toJSON(),
    product: product,
    user: user
  };
};

// Check if transaction is a stock addition
InventoryTransaction.prototype.isStockAddition = function() {
  return this.quantity > 0;
};

// Check if transaction is a stock removal
InventoryTransaction.prototype.isStockRemoval = function() {
  return this.quantity < 0;
};

// Get transaction type display name
InventoryTransaction.prototype.getTransactionTypeDisplay = function() {
  const typeMap = {
    'stock_in': 'Stock In',
    'stock_out': 'Stock Out',
    'adjustment': 'Adjustment',
    'correction': 'Correction',
    'return': 'Return',
    'damaged': 'Damaged',
    'expired': 'Expired',
    'transfer': 'Transfer'
  };
  
  return typeMap[this.transactionType] || this.transactionType;
};

// Get reference type display name
InventoryTransaction.prototype.getReferenceTypeDisplay = function() {
  const typeMap = {
    'order': 'Order',
    'manual': 'Manual',
    'system': 'System',
    'return': 'Return',
    'transfer': 'Transfer',
    'adjustment': 'Adjustment'
  };
  
  return typeMap[this.referenceType] || this.referenceType;
};

/**
 * Class Methods
 */

// Find transactions by product
InventoryTransaction.findByProduct = async function(productId, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { productId: productId },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName']
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find transactions by user
InventoryTransaction.findByUser = async function(userId, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { userId: userId },
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      attributes: ['id', 'name', 'slug', 'sku']
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find transactions by type
InventoryTransaction.findByType = async function(transactionType, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { transactionType: transactionType },
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'sku']
      },
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName']
      }
    ],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find transactions by reference
InventoryTransaction.findByReference = async function(referenceType, referenceId, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      referenceType: referenceType,
      referenceId: referenceId 
    },
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'sku']
      },
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName']
      }
    ],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Get inventory statistics
InventoryTransaction.getStatistics = async function(productId = null) {
  const whereClause = {};
  if (productId) {
    whereClause.productId = productId;
  }
  
  const totalTransactions = await this.count({ where: whereClause });
  
  const stockInTransactions = await this.count({
    where: { ...whereClause, transactionType: 'stock_in' }
  });
  
  const stockOutTransactions = await this.count({
    where: { ...whereClause, transactionType: 'stock_out' }
  });
  
  const adjustmentTransactions = await this.count({
    where: { ...whereClause, transactionType: 'adjustment' }
  });
  
  const totalStockIn = await this.sum('quantity', {
    where: { ...whereClause, transactionType: 'stock_in' }
  });
  
  const totalStockOut = await this.sum('quantity', {
    where: { ...whereClause, transactionType: 'stock_out' }
  });
  
  const totalCost = await this.sum('totalCost', {
    where: { ...whereClause, totalCost: { [sequelize.Op.ne]: null } }
  });
  
  return {
    totalTransactions,
    stockInTransactions,
    stockOutTransactions,
    adjustmentTransactions,
    totalStockIn: parseInt(totalStockIn || 0),
    totalStockOut: Math.abs(parseInt(totalStockOut || 0)),
    totalCost: parseFloat(totalCost || 0)
  };
};

// Create stock in transaction
InventoryTransaction.createStockIn = async function(productId, quantity, userId, reason = null, unitCost = null, referenceType = 'manual', referenceId = null) {
  return await this.create({
    productId: productId,
    userId: userId,
    transactionType: 'stock_in',
    quantity: Math.abs(quantity),
    reason: reason,
    unitCost: unitCost,
    referenceType: referenceType,
    referenceId: referenceId
  });
};

// Create stock out transaction
InventoryTransaction.createStockOut = async function(productId, quantity, userId, reason = null, referenceType = 'manual', referenceId = null) {
  return await this.create({
    productId: productId,
    userId: userId,
    transactionType: 'stock_out',
    quantity: -Math.abs(quantity),
    reason: reason,
    referenceType: referenceType,
    referenceId: referenceId
  });
};

// Create adjustment transaction
InventoryTransaction.createAdjustment = async function(productId, quantity, userId, reason = null, referenceType = 'adjustment', referenceId = null) {
  return await this.create({
    productId: productId,
    userId: userId,
    transactionType: 'adjustment',
    quantity: quantity,
    reason: reason,
    referenceType: referenceType,
    referenceId: referenceId
  });
};

// Create order-based stock out transaction
InventoryTransaction.createOrderStockOut = async function(orderId, orderItems) {
  const transactions = [];
  
  for (const item of orderItems) {
    const transaction = await this.create({
      productId: item.productId,
      userId: null, // System transaction
      transactionType: 'stock_out',
      quantity: -item.quantity,
      reason: `Order fulfillment - Order #${orderId}`,
      referenceType: 'order',
      referenceId: orderId,
      referenceNumber: orderId
    });
    
    transactions.push(transaction);
  }
  
  return transactions;
};

// Get recent transactions
InventoryTransaction.findRecentTransactions = async function(limit = 20) {
  return await this.findAll({
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug', 'sku']
      },
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName']
      }
    ],
    limit: limit,
    order: [['createdAt', 'DESC']]
  });
};

module.exports = InventoryTransaction;
