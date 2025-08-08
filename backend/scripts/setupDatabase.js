const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a connection to PostgreSQL server (without specifying database)
const sequelizeServer = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'qbatch',
  dialect: 'postgres',
  logging: false
});

// Create database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'gameStoreDb',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'qbatch',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Test server connection
    await sequelizeServer.authenticate();
    console.log('✅ Connected to PostgreSQL server');
    
    // Create database if it doesn't exist
    try {
      await sequelizeServer.query(`CREATE DATABASE "${process.env.DB_NAME || 'gameStoreDb'}"`);
      console.log('✅ Database created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Database already exists');
      } else {
        throw error;
      }
    }
    
    // Close server connection
    await sequelizeServer.close();
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Import models
    const models = require('../src/models');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synchronized');
    
    // Import and run seed data
    try {
      const seedData = require('./seeds/seedData');
      await seedData();
      console.log('✅ Seed data inserted');
    } catch (error) {
      console.log('⚠️  Seed data insertion failed (this is normal if data already exists):', error.message);
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupDatabase(); 