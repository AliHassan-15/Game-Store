const logger = require('../utils/logger/logger');

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  logger.info(`Request: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id || 'anonymous'
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log response details
    logger.info(`Response: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: duration,
      contentLength: res.get('Content-Length') || 0,
      userId: req.user?.id || 'anonymous'
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  logger.error(`Error in ${req.method} ${req.originalUrl}:`, {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  next(err);
};

// Performance logger middleware
const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration: duration,
        statusCode: res.statusCode,
        userId: req.user?.id || 'anonymous'
      });
    }
    
    // Log very slow requests (over 5 seconds)
    if (duration > 5000) {
      logger.error(`Very slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration: duration,
        statusCode: res.statusCode,
        userId: req.user?.id || 'anonymous'
      });
    }
  });

  next();
};

// Security logger middleware
const securityLogger = (req, res, next) => {
  // Log potential security issues
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection attempts
    /eval\s*\(/i, // Code injection attempts
  ];

  const url = req.originalUrl;
  const userAgent = req.get('User-Agent') || '';
  const referer = req.get('Referer') || '';

  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)) {
      logger.warn(`Potential security threat detected:`, {
        pattern: pattern.toString(),
        url: url,
        userAgent: userAgent,
        referer: referer,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Log failed authentication attempts
  if (req.path.includes('/auth') && res.statusCode === 401) {
    logger.warn(`Failed authentication attempt:`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: userAgent,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// API usage logger middleware
const apiUsageLogger = (req, res, next) => {
  // Only log API requests
  if (req.path.startsWith('/api')) {
    const apiKey = req.get('X-API-Key');
    const clientVersion = req.get('X-Client-Version');
    const platform = req.get('X-Platform');

    logger.info(`API Request: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      apiKey: apiKey ? 'present' : 'none',
      clientVersion: clientVersion || 'unknown',
      platform: platform || 'unknown',
      userId: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Development logger middleware (more verbose)
const devLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[DEV] ${req.method} ${req.originalUrl}`, {
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      userId: req.user?.id || 'anonymous'
    });
  }
  next();
};

// Production logger middleware (less verbose)
const prodLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Only log important requests in production
    const importantPaths = ['/api/auth', '/api/orders', '/api/payments', '/api/admin'];
    const isImportant = importantPaths.some(path => req.path.startsWith(path));
    
    if (isImportant) {
      logger.info(`[PROD] ${req.method} ${req.originalUrl}`, {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  performanceLogger,
  securityLogger,
  apiUsageLogger,
  devLogger,
  prodLogger
};
