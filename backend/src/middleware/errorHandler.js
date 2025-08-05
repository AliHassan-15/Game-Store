const logger = require('../utils/logger/logger');

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Sequelize validation errors
const handleSequelizeValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Sequelize unique constraint errors
const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors[0].path;
  const message = `${field} already exists`;
  return new AppError(message, 400);
};

// Handle Sequelize foreign key constraint errors
const handleSequelizeForeignKeyConstraintError = (err) => {
  const message = 'Referenced record does not exist';
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};

// Handle JWT expiration errors
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again.', 401);
};

// Handle Cast errors (invalid MongoDB ObjectId)
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplicate field errors
const handleDuplicateFieldError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Development error response
const sendErrorDev = (err, req, res) => {
  // API error response
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err,
      stack: err.stack
    });
  }

  // Rendered error page (if using server-side rendering)
  logger.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// Production error response
const sendErrorProd = (err, req, res) => {
  // API error response
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }

  // Rendered error page (if using server-side rendering)
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // Programming or other unknown error: don't leak error details
  logger.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error
  logger.error(`Error ${err.statusCode}: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  if (error.name === 'SequelizeValidationError') {
    error = handleSequelizeValidationError(error);
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueConstraintError(error);
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    error = handleSequelizeForeignKeyConstraintError(error);
  }
  if (error.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (error.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  if (error.name === 'CastError') {
    error = handleCastError(error);
  }
  if (error.code === 11000) {
    error = handleDuplicateFieldError(error);
  }
  if (error.name === 'ValidationError') {
    error = handleValidationError(error);
  }

  // Send error response based on environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, req, res);
  }
};

// Handle unhandled promise rejections
const handleUnhandledRejection = (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
};

// Handle uncaught exceptions
const handleUncaughtException = (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleUnhandledRejection,
  handleUncaughtException
};
