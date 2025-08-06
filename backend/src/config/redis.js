const redis = require('redis');
const logger = require('../utils/logger/logger');

// Redis configuration with camelCase variables
const redisConfig = {
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined
};

// Redis client configuration
const redisClient = redis.createClient({
  host: redisConfig.redisHost,
  port: redisConfig.redisPort,
  password: redisConfig.redisPassword,
  retry_strategy: function(retryOptions) {
    if (retryOptions.error && retryOptions.error.code === 'ECONNREFUSED') {
      if (process.env.NODE_ENV === 'development') {
        // In development, don't retry if Redis is not available
        return undefined;
      }
      logger.error('Redis server refused the connection');
      return new Error('Redis server refused the connection');
    }
    if (retryOptions.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (retryOptions.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    // Retry with exponential backoff
    return Math.min(retryOptions.attempt * 100, 3000);
  }
});

// Redis event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (error) => {
  if (process.env.NODE_ENV === 'development') {
    // Silently ignore Redis errors in development
    return;
  }
  logger.error('Redis Client Error:', error.message);
});

redisClient.on('end', () => {
  if (process.env.NODE_ENV === 'development') {
    // Silently ignore Redis disconnection in development
    return;
  }
  logger.info('Redis client disconnected');
});

redisClient.on('reconnecting', () => {
  if (process.env.NODE_ENV === 'development') {
    // Silently ignore Redis reconnection attempts in development
    return;
  }
  logger.info('Redis client reconnecting...');
});

// Redis utility functions
const redisUtils = {
  // Set key with expiration
  setWithExpiration: async (key, seconds, value) => {
    try {
      await redisClient.setEx(key, seconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis setEx error:', error.message);
      return false;
    }
  },

  // Get key
  getValue: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error.message);
      return null;
    }
  },

  // Delete key
  deleteKey: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error.message);
      return false;
    }
  },

  // Check if key exists
  keyExists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error.message);
      return false;
    }
  },

  // Set expiration for existing key
  setExpiration: async (key, seconds) => {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error.message);
      return false;
    }
  },

  // Get all keys matching pattern
  getKeysByPattern: async (pattern) => {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error.message);
      return [];
    }
  },

  // Flush all data (use with caution)
  clearAllData: async () => {
    try {
      await redisClient.flushAll();
      logger.info('Redis cache cleared');
      return true;
    } catch (error) {
      logger.error('Redis flushAll error:', error.message);
      return false;
    }
  },

  // Store session data
  storeSession: async (sessionId, sessionData, expirationTime = 3600) => {
    try {
      const sessionKey = `session:${sessionId}`;
      await redisClient.setEx(sessionKey, expirationTime, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      logger.error('Redis storeSession error:', error.message);
      return false;
    }
  },

  // Get session data
  getSession: async (sessionId) => {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await redisClient.get(sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Redis getSession error:', error.message);
      return null;
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const sessionKey = `session:${sessionId}`;
      await redisClient.del(sessionKey);
      return true;
    } catch (error) {
      logger.error('Redis deleteSession error:', error.message);
      return false;
    }
  }
};

// Test Redis connection
const testRedisConnection = async () => {
  try {
    await redisClient.ping();
    logger.info('Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error.message);
    throw error;
  }
};

// Close Redis connection
const closeRedisConnection = async () => {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed successfully');
    return true;
  } catch (error) {
    logger.error('Error closing Redis connection:', error.message);
    throw error;
  }
};

module.exports = {
  redisClient,
  redisConfig,
  redisUtils,
  testRedisConnection,
  closeRedisConnection
};
