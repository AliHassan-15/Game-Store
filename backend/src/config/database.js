const { Sequelize } = require('sequelize');
const logger = require('../utils/logger/logger');

// Database configuration with camelCase variables
const databaseConfig = {
  databaseName: process.env.DB_NAME,
  databaseUser: process.env.DB_USER,
  databasePassword: process.env.DB_PASSWORD,
  databaseHost: process.env.DB_HOST,
  databasePort: process.env.DB_PORT,
  nodeEnvironment: process.env.NODE_ENV || 'development'
};

// Sequelize instance configuration
const sequelize = new Sequelize(
  databaseConfig.databaseName,
  databaseConfig.databaseUser,
  databaseConfig.databasePassword,
  {
    host: databaseConfig.databaseHost,
    port: databaseConfig.databasePort,
    dialect: 'postgres',
    logging: databaseConfig.nodeEnvironment === 'development' ? console.log : false,
    pool: {
      max: 10,        // Maximum number of connection instances
      min: 0,         // Minimum number of connection instances
      acquire: 30000, // Maximum time (ms) that pool will try to get connection before throwing error
      idle: 10000     // Maximum time (ms) that a connection can be idle before being released
    },
    define: {
      timestamps: true,      // Adds createdAt and updatedAt timestamps
      underscored: true,     // Use snake_case for column names
      freezeTableName: true, // Don't pluralize table names
      paranoid: false        // Don't use soft deletes by default
    },
    dialectOptions: {
      ssl: databaseConfig.nodeEnvironment === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

// Test database connection
const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the database:', error.message);
    throw error;
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (forceSync = false) => {
  try {
    await sequelize.sync({ force: forceSync });
    logger.info(`Database synchronized successfully. Force: ${forceSync}`);
    return true;
  } catch (error) {
    logger.error('Database synchronization failed:', error.message);
    throw error;
  }
};

// Close database connection
const closeDatabaseConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed successfully.');
    return true;
  } catch (error) {
    logger.error('Error closing database connection:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  databaseConfig,
  testDatabaseConnection,
  syncDatabase,
  closeDatabaseConnection
};
