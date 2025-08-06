const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Product = require('./Product');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');
const InventoryTransaction = require('./InventoryTransaction');
const UserAddress = require('./UserAddress');
const UserPayment = require('./UserPayment');
const ActivityLog = require('./ActivityLog');

// User Associations
User.hasMany(Cart, {
  foreignKey: 'userId',
  as: 'carts',
  onDelete: 'CASCADE'
});

User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
  onDelete: 'RESTRICT'
});

User.hasMany(Review, {
  foreignKey: 'userId',
  as: 'reviews',
  onDelete: 'CASCADE'
});

User.hasMany(UserAddress, {
  foreignKey: 'userId',
  as: 'addresses',
  onDelete: 'CASCADE'
});

User.hasMany(UserPayment, {
  foreignKey: 'userId',
  as: 'payments',
  onDelete: 'CASCADE'
});

User.hasMany(ActivityLog, {
  foreignKey: 'userId',
  as: 'activities',
  onDelete: 'SET NULL'
});

// Category Associations
Category.hasMany(SubCategory, {
  foreignKey: 'categoryId',
  as: 'subCategories',
  onDelete: 'CASCADE'
});

Category.hasMany(Product, {
  foreignKey: 'categoryId',
  as: 'products',
  onDelete: 'RESTRICT'
});

// SubCategory Associations
SubCategory.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
  onDelete: 'CASCADE'
});

SubCategory.hasMany(Product, {
  foreignKey: 'subCategoryId',
  as: 'products',
  onDelete: 'SET NULL'
});

// Product Associations
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
  onDelete: 'RESTRICT'
});

Product.belongsTo(SubCategory, {
  foreignKey: 'subCategoryId',
  as: 'subCategory',
  onDelete: 'SET NULL'
});

Product.hasMany(CartItem, {
  foreignKey: 'productId',
  as: 'cartItems',
  onDelete: 'CASCADE'
});

Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
  onDelete: 'RESTRICT'
});

Product.hasMany(Review, {
  foreignKey: 'productId',
  as: 'reviews',
  onDelete: 'CASCADE'
});

Product.hasMany(InventoryTransaction, {
  foreignKey: 'productId',
  as: 'inventoryTransactions',
  onDelete: 'CASCADE'
});

// Cart Associations
Cart.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'cartItems',
  onDelete: 'CASCADE'
});

// CartItem Associations
CartItem.belongsTo(Cart, {
  foreignKey: 'cartId',
  as: 'cart',
  onDelete: 'CASCADE'
});

CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
  onDelete: 'CASCADE'
});

// Order Associations
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'RESTRICT'
});

Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'orderItems',
  onDelete: 'CASCADE'
});

Order.hasMany(Review, {
  foreignKey: 'orderId',
  as: 'reviews',
  onDelete: 'SET NULL'
});

// OrderItem Associations
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
  onDelete: 'RESTRICT'
});

// Review Associations
Review.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

Review.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
  onDelete: 'CASCADE'
});

Review.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
  onDelete: 'SET NULL'
});

// InventoryTransaction Associations
InventoryTransaction.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
  onDelete: 'CASCADE'
});

InventoryTransaction.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'SET NULL'
});

// UserAddress Associations
UserAddress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

// UserPayment Associations
UserPayment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

// ActivityLog Associations
ActivityLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'SET NULL'
});



/**
 * Database Synchronization Function
 * Creates all tables and relationships
 */
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

/**
 * Database Connection Test Function
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Close Database Connection Function
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Export all models and utility functions
 */
module.exports = {
  // Database instance
  sequelize,
  
  // Models
  User,
  Category,
  SubCategory,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Review,
  InventoryTransaction,
  UserAddress,
  UserPayment,
  ActivityLog,
  
  // Database utility functions
  syncDatabase,
  testConnection,
  closeConnection
};
