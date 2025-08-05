const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Custom logger methods
const customLogger = {
  // Error logging
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },

  // Warning logging
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },

  // Info logging
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },

  // HTTP request logging
  http: (message, meta = {}) => {
    logger.http(message, meta);
  },

  // Debug logging
  debug: (message, meta = {}) => {
    logger.debug(message, meta);
  },

  // Database query logging
  query: (sql, duration, meta = {}) => {
    logger.debug(`Database Query (${duration}ms): ${sql}`, meta);
  },

  // API request logging
  api: (method, url, statusCode, duration, meta = {}) => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${method} ${url} - ${statusCode} (${duration}ms)`, meta);
  },

  // Authentication logging
  auth: (action, userId, success, meta = {}) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Authentication ${action} for user ${userId} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
  },

  // Payment logging
  payment: (action, orderId, amount, status, meta = {}) => {
    const level = status === 'success' ? 'info' : 'error';
    logger[level](`Payment ${action} for order ${orderId} - Amount: $${amount} - Status: ${status}`, meta);
  },

  // Order logging
  order: (action, orderId, status, meta = {}) => {
    logger.info(`Order ${action} - ID: ${orderId} - Status: ${status}`, meta);
  },

  // Product logging
  product: (action, productId, meta = {}) => {
    logger.info(`Product ${action} - ID: ${productId}`, meta);
  },

  // User logging
  user: (action, userId, meta = {}) => {
    logger.info(`User ${action} - ID: ${userId}`, meta);
  },

  // File upload logging
  upload: (action, filename, size, meta = {}) => {
    logger.info(`File upload ${action} - ${filename} (${size} bytes)`, meta);
  },

  // Email logging
  email: (action, recipient, subject, success, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger[level](`Email ${action} to ${recipient} - Subject: ${subject} - ${success ? 'SENT' : 'FAILED'}`, meta);
  },

  // Security logging
  security: (event, userId, ip, meta = {}) => {
    logger.warn(`Security event: ${event} - User: ${userId} - IP: ${ip}`, meta);
  },

  // Performance logging
  performance: (operation, duration, meta = {}) => {
    const level = duration > 1000 ? 'warn' : 'debug';
    logger[level](`Performance: ${operation} took ${duration}ms`, meta);
  },

  // Cache logging
  cache: (action, key, hit, meta = {}) => {
    logger.debug(`Cache ${action} - Key: ${key} - ${hit ? 'HIT' : 'MISS'}`, meta);
  },

  // Database logging
  database: (action, table, duration, meta = {}) => {
    const level = duration > 500 ? 'warn' : 'debug';
    logger[level](`Database ${action} on ${table} - ${duration}ms`, meta);
  },

  // External API logging
  externalApi: (service, endpoint, method, statusCode, duration, meta = {}) => {
    const level = statusCode >= 400 ? 'warn' : 'debug';
    logger[level](`External API ${service} ${method} ${endpoint} - ${statusCode} (${duration}ms)`, meta);
  },

  // Job/Queue logging
  job: (action, jobId, status, meta = {}) => {
    const level = status === 'completed' ? 'info' : status === 'failed' ? 'error' : 'debug';
    logger[level](`Job ${action} - ID: ${jobId} - Status: ${status}`, meta);
  },

  // System logging
  system: (component, action, status, meta = {}) => {
    const level = status === 'error' ? 'error' : status === 'warning' ? 'warn' : 'info';
    logger[level](`System ${component} ${action} - Status: ${status}`, meta);
  },

  // Business logic logging
  business: (action, entity, entityId, details, meta = {}) => {
    logger.info(`Business ${action} - ${entity}: ${entityId} - ${details}`, meta);
  },

  // Audit logging
  audit: (action, userId, resource, resourceId, changes, meta = {}) => {
    logger.info(`Audit ${action} - User: ${userId} - ${resource}: ${resourceId} - Changes: ${JSON.stringify(changes)}`, meta);
  },

  // Notification logging
  notification: (type, recipient, success, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger[level](`Notification ${type} to ${recipient} - ${success ? 'SENT' : 'FAILED'}`, meta);
  },

  // Export/Import logging
  export: (type, filename, recordCount, success, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger[level](`Export ${type} - File: ${filename} - Records: ${recordCount} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
  },

  import: (type, filename, recordCount, success, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger[level](`Import ${type} - File: ${filename} - Records: ${recordCount} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
  },

  // Backup logging
  backup: (type, filename, size, success, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger[level](`Backup ${type} - File: ${filename} - Size: ${size} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
  },

  // Cron job logging
  cron: (jobName, status, duration, meta = {}) => {
    const level = status === 'completed' ? 'info' : status === 'failed' ? 'error' : 'debug';
    logger[level](`Cron job ${jobName} - Status: ${status} - Duration: ${duration}ms`, meta);
  },

  // Webhook logging
  webhook: (provider, event, status, meta = {}) => {
    const level = status === 'success' ? 'info' : 'error';
    logger[level](`Webhook ${provider} ${event} - Status: ${status}`, meta);
  },

  // Rate limiting logging
  rateLimit: (ip, endpoint, limit, meta = {}) => {
    logger.warn(`Rate limit exceeded - IP: ${ip} - Endpoint: ${endpoint} - Limit: ${limit}`, meta);
  },

  // Validation logging
  validation: (entity, action, errors, meta = {}) => {
    logger.warn(`Validation failed for ${entity} ${action} - Errors: ${JSON.stringify(errors)}`, meta);
  },

  // Middleware logging
  middleware: (name, action, duration, meta = {}) => {
    const level = duration > 100 ? 'warn' : 'debug';
    logger[level](`Middleware ${name} ${action} - ${duration}ms`, meta);
  },

  // Route logging
  route: (method, path, params, meta = {}) => {
    logger.debug(`Route accessed - ${method} ${path} - Params: ${JSON.stringify(params)}`, meta);
  },

  // Error with stack trace
  errorWithStack: (message, error, meta = {}) => {
    logger.error(`${message} - ${error.message}`, {
      ...meta,
      stack: error.stack,
      name: error.name
    });
  },

  // Request logging with full details
  request: (req, res, duration, meta = {}) => {
    const { method, url, ip, userAgent } = req;
    const { statusCode } = res;
    const userId = req.user?.id || 'anonymous';
    
    const level = statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${method} ${url} - ${statusCode} (${duration}ms) - User: ${userId} - IP: ${ip}`, {
      ...meta,
      userAgent,
      requestBody: req.body,
      queryParams: req.query,
      pathParams: req.params
    });
  },

  // Response logging
  response: (req, res, duration, meta = {}) => {
    const { method, url } = req;
    const { statusCode } = res;
    
    const level = statusCode >= 400 ? 'warn' : 'debug';
    logger[level](`Response ${method} ${url} - ${statusCode} (${duration}ms)`, meta);
  },

  // Memory usage logging
  memory: (usage, meta = {}) => {
    const { rss, heapUsed, heapTotal, external } = usage;
    logger.debug(`Memory usage - RSS: ${Math.round(rss / 1024 / 1024)}MB, Heap: ${Math.round(heapUsed / 1024 / 1024)}MB/${Math.round(heapTotal / 1024 / 1024)}MB, External: ${Math.round(external / 1024 / 1024)}MB`, meta);
  },

  // CPU usage logging
  cpu: (usage, meta = {}) => {
    logger.debug(`CPU usage - ${usage}%`, meta);
  },

  // Database connection logging
  dbConnection: (action, status, meta = {}) => {
    const level = status === 'connected' ? 'info' : status === 'error' ? 'error' : 'warn';
    logger[level](`Database connection ${action} - Status: ${status}`, meta);
  },

  // Redis connection logging
  redisConnection: (action, status, meta = {}) => {
    const level = status === 'connected' ? 'info' : status === 'error' ? 'error' : 'warn';
    logger[level](`Redis connection ${action} - Status: ${status}`, meta);
  },

  // File system logging
  fileSystem: (action, path, success, meta = {}) => {
    const level = success ? 'debug' : 'error';
    logger[level](`File system ${action} - Path: ${path} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
  },

  // Configuration logging
  config: (action, key, value, meta = {}) => {
    logger.debug(`Configuration ${action} - ${key}: ${value}`, meta);
  },

  // Startup logging
  startup: (component, status, meta = {}) => {
    const level = status === 'started' ? 'info' : status === 'error' ? 'error' : 'warn';
    logger[level](`Startup ${component} - Status: ${status}`, meta);
  },

  // Shutdown logging
  shutdown: (component, status, meta = {}) => {
    const level = status === 'stopped' ? 'info' : status === 'error' ? 'error' : 'warn';
    logger[level](`Shutdown ${component} - Status: ${status}`, meta);
  }
};

// Export both the winston logger and custom logger
module.exports = {
  ...logger,
  ...customLogger,
  stream: logger.stream
};
