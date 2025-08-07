const { sequelize } = require('../../src/config/database');
const { 
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
  ActivityLog 
} = require('../../src/models');

async function up() {
  try {
    // Sync all models to create tables
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

async function down() {
  try {
    // Drop all tables
    await sequelize.drop();
    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
}

module.exports = { up, down };
