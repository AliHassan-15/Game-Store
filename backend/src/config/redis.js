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
  socket: {
    host: redisConfig.redisHost,
    port: redisConfig.redisPort,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis max retry attempts reached');
        return new Error('Redis max retry attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  },
  password: redisConfig.redisPassword
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis client connected');
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Redis connection failed in development mode, continuing without Redis');
      return false;
    }
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

// Check if Redis is connected
const isRedisConnected = () => {
  return redisClient.isReady;
};

// Redis event handlers
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

// Initialize Redis connection
connectRedis();

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

  // Set key with expiration (alias for setWithExpiration)
  setEx: async (key, seconds, value) => {
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

  // Get TTL of key
  getTTL: async (key) => {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error.message);
      return -1;
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

  // Get all keys matching pattern (alias for getKeysByPattern)
  keys: async (pattern) => {
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

  // Flush all data (alias for clearAllData)
  flushAll: async () => {
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
    if (!redisClient.isReady) {
      await redisClient.connect();
    }
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
