const Joi = require('joi');
const logger = require('../../utils/logger/logger');

// Validation error formatter
const formatValidationError = (error) => {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));

  return {
    success: false,
    message: 'Validation failed',
    errors: errors
  };
};

// Main validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      logger.warn(`Validation failed for ${req.method} ${req.path}:`, {
        errors: error.details,
        body: req.body,
        query: req.query,
        params: req.params
      });

      return res.status(400).json(formatValidationError(error));
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Validate request body
const validateBody = (schema) => validate(schema, 'body');

// Validate request query parameters
const validateQuery = (schema) => validate(schema, 'query');

// Validate request parameters
const validateParams = (schema) => validate(schema, 'params');

// Validate multiple properties
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each property
    for (const [property, schema] of Object.entries(schemas)) {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        errors.push(...error.details.map(detail => ({
          property,
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        })));
      } else {
        req[property] = value;
      }
    }

    if (errors.length > 0) {
      logger.warn(`Multiple validation failed for ${req.method} ${req.path}:`, {
        errors: errors,
        body: req.body,
        query: req.query,
        params: req.params
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'price', 'rating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // ID schema
  id: Joi.string().uuid().required(),

  // Email schema
  email: Joi.string().email().required(),

  // Password schema
  password: Joi.string().min(8).max(128).required(),

  // Name schema
  name: Joi.string().min(2).max(100).required(),

  // Phone schema
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),

  // URL schema
  url: Joi.string().uri().optional(),

  // Price schema
  price: Joi.number().positive().precision(2).required(),

  // Quantity schema
  quantity: Joi.number().integer().min(1).required(),

  // Rating schema
  rating: Joi.number().integer().min(1).max(5).required(),

  // Boolean schema
  boolean: Joi.boolean().required(),

  // Date schema
  date: Joi.date().iso().required(),

  // Object ID schema (for MongoDB-like IDs)
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  // Slug schema
  slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required(),

  // Search query schema
  search: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    category: Joi.string().uuid().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    rating: Joi.number().integer().min(1).max(5).optional(),
    inStock: Joi.boolean().optional()
  }),

  // Address schema
  address: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    company: Joi.string().max(100).optional(),
    addressLine1: Joi.string().min(5).max(200).required(),
    addressLine2: Joi.string().max(200).optional(),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    postalCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
  }),

  // Payment method schema
  paymentMethod: Joi.object({
    type: Joi.string().valid('card', 'paypal').required(),
    cardType: Joi.string().valid('visa', 'mastercard', 'amex', 'discover').optional(),
    last4: Joi.string().length(4).pattern(/^\d{4}$/).optional(),
    expiryMonth: Joi.number().integer().min(1).max(12).optional(),
    expiryYear: Joi.number().integer().min(new Date().getFullYear()).optional(),
    cardholderName: Joi.string().min(2).max(100).optional()
  })
};

// Custom validation functions
const customValidators = {
  // Validate password strength
  passwordStrength: (value, helpers) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return helpers.error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    return value;
  },

  // Validate phone number format
  phoneFormat: (value, helpers) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      return helpers.error('Invalid phone number format');
    }
    return value;
  },

  // Validate price range
  priceRange: (value, helpers) => {
    if (value < 0 || value > 999999.99) {
      return helpers.error('Price must be between 0 and 999,999.99');
    }
    return value;
  },

  // Validate stock quantity
  stockQuantity: (value, helpers) => {
    if (value < 0 || value > 999999) {
      return helpers.error('Stock quantity must be between 0 and 999,999');
    }
    return value;
  },

  // Validate image URL
  imageUrl: (value, helpers) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const url = value.toLowerCase();
    
    if (!imageExtensions.some(ext => url.includes(ext))) {
      return helpers.error('URL must point to a valid image file');
    }
    
    return value;
  },

  // Validate future date
  futureDate: (value, helpers) => {
    if (new Date(value) <= new Date()) {
      return helpers.error('Date must be in the future');
    }
    return value;
  },

  // Validate past date
  pastDate: (value, helpers) => {
    if (new Date(value) >= new Date()) {
      return helpers.error('Date must be in the past');
    }
    return value;
  }
};

// Validation middleware with custom error handling
const validateWithCustomError = (schema, property = 'body', customErrorHandler) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      if (customErrorHandler) {
        return customErrorHandler(error, req, res, next);
      }

      logger.warn(`Validation failed for ${req.method} ${req.path}:`, {
        errors: error.details,
        property: property,
        data: req[property]
      });

      return res.status(400).json(formatValidationError(error));
    }

    req[property] = value;
    next();
  };
};

// Async validation middleware
const validateAsync = (schema, property = 'body') => {
  return async (req, res, next) => {
    try {
      const { error, value } = await schema.validateAsync(req[property], {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        logger.warn(`Async validation failed for ${req.method} ${req.path}:`, {
          errors: error.details,
          property: property,
          data: req[property]
        });

        return res.status(400).json(formatValidationError(error));
      }

      req[property] = value;
      next();
    } catch (error) {
      logger.error('Async validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Validation error occurred'
      });
    }
  };
};

// Conditional validation middleware
const validateConditionally = (condition, schema, property = 'body') => {
  return (req, res, next) => {
    if (condition(req)) {
      return validate(schema, property)(req, res, next);
    }
    next();
  };
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateMultiple,
  validateWithCustomError,
  validateAsync,
  validateConditionally,
  formatValidationError,
  commonSchemas,
  customValidators
};
