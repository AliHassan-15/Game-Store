const Joi = require('joi');
const { VALIDATION } = require('../constants/constants');

/**
 * Common validation schemas
 */
const commonSchemas = {
  // ID validation
  id: Joi.number().integer().positive().required(),
  
  // Optional ID validation
  optionalId: Joi.number().integer().positive().optional(),
  
  // Email validation
  email: Joi.string()
    .email()
    .max(VALIDATION.EMAIL.MAX_LENGTH)
    .lowercase()
    .required(),
  
  // Optional email validation
  optionalEmail: Joi.string()
    .email()
    .max(VALIDATION.EMAIL.MAX_LENGTH)
    .lowercase()
    .optional(),
  
  // Password validation
  password: Joi.string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH)
    .max(VALIDATION.PASSWORD.MAX_LENGTH)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  
  // Name validation
  firstName: Joi.string()
    .min(VALIDATION.NAME.MIN_LENGTH)
    .max(VALIDATION.NAME.MAX_LENGTH)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
  
  lastName: Joi.string()
    .min(VALIDATION.NAME.MIN_LENGTH)
    .max(VALIDATION.NAME.MAX_LENGTH)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
  
  // Phone validation
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .max(VALIDATION.PHONE.MAX_LENGTH)
    .optional(),
  
  // URL validation
  url: Joi.string().uri().optional(),
  
  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  }),
  
  // Address validation
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
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    isDefault: Joi.boolean().default(false)
  }),
  
  // Payment method validation
  paymentMethod: Joi.object({
    type: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'bank_transfer').required(),
    cardNumber: Joi.string().pattern(/^[0-9]{13,19}$/).when('type', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    expiryMonth: Joi.number().integer().min(1).max(12).when('type', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    expiryYear: Joi.number().integer().min(new Date().getFullYear()).max(new Date().getFullYear() + 20).when('type', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    cvv: Joi.string().pattern(/^[0-9]{3,4}$/).when('type', {
      is: Joi.string().valid('credit_card', 'debit_card'),
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
  })
};

/**
 * Custom validation functions
 */
const customValidators = {
  /**
   * Validate password strength
   */
  validatePasswordStrength: (password) => {
    const errors = [];
    
    if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
      errors.push(`Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters long`);
    }
    
    if (password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
      errors.push(`Password cannot exceed ${VALIDATION.PASSWORD.MAX_LENGTH} characters`);
    }
    
    if (VALIDATION.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (VALIDATION.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (VALIDATION.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (VALIDATION.PASSWORD.REQUIRE_SPECIAL_CHARS && !/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate phone number format
   */
  validatePhoneFormat: (phone) => {
    if (!phone) return { isValid: true, errors: [] };
    
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    const isValid = phoneRegex.test(phone);
    
    return {
      isValid,
      errors: isValid ? [] : ['Please provide a valid phone number']
    };
  },

  /**
   * Validate email format
   */
  validateEmailFormat: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      isValid,
      errors: isValid ? [] : ['Please provide a valid email address']
    };
  },

  /**
   * Validate URL format
   */
  validateUrlFormat: (url) => {
    if (!url) return { isValid: true, errors: [] };
    
    try {
      new URL(url);
      return { isValid: true, errors: [] };
    } catch {
      return { isValid: false, errors: ['Please provide a valid URL'] };
    }
  },

  /**
   * Validate file size
   */
  validateFileSize: (fileSize, maxSize = 5 * 1024 * 1024) => {
    const isValid = fileSize <= maxSize;
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    
    return {
      isValid,
      errors: isValid ? [] : [`File size must be less than ${maxSizeMB}MB`]
    };
  },

  /**
   * Validate file type
   */
  validateFileType: (mimeType, allowedTypes) => {
    const isValid = allowedTypes.includes(mimeType);
    
    return {
      isValid,
      errors: isValid ? [] : [`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`]
    };
  },

  /**
   * Validate SKU format
   */
  validateSkuFormat: (sku) => {
    const skuRegex = /^[A-Z0-9\-_]+$/;
    const isValid = skuRegex.test(sku);
    
    return {
      isValid,
      errors: isValid ? [] : ['SKU can only contain uppercase letters, numbers, hyphens, and underscores']
    };
  },

  /**
   * Validate barcode format
   */
  validateBarcodeFormat: (barcode) => {
    if (!barcode) return { isValid: true, errors: [] };
    
    const barcodeRegex = /^[0-9]+$/;
    const isValid = barcodeRegex.test(barcode);
    
    return {
      isValid,
      errors: isValid ? [] : ['Barcode can only contain numbers']
    };
  },

  /**
   * Validate price format
   */
  validatePriceFormat: (price) => {
    const isValid = typeof price === 'number' && price >= 0 && price <= 999999.99;
    
    return {
      isValid,
      errors: isValid ? [] : ['Price must be a number between 0 and 999,999.99']
    };
  },

  /**
   * Validate stock quantity
   */
  validateStockQuantity: (quantity) => {
    const isValid = Number.isInteger(quantity) && quantity >= 0 && quantity <= 999999;
    
    return {
      isValid,
      errors: isValid ? [] : ['Stock quantity must be a whole number between 0 and 999,999']
    };
  },

  /**
   * Validate rating
   */
  validateRating: (rating) => {
    const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5;
    
    return {
      isValid,
      errors: isValid ? [] : ['Rating must be a number between 1 and 5']
    };
  },

  /**
   * Validate postal code format
   */
  validatePostalCode: (postalCode, country = 'US') => {
    let regex;
    
    switch (country.toUpperCase()) {
      case 'US':
        regex = /^\d{5}(-\d{4})?$/;
        break;
      case 'CA':
        regex = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/;
        break;
      case 'UK':
        regex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
        break;
      default:
        regex = /^[\w\s-]{3,10}$/;
    }
    
    const isValid = regex.test(postalCode);
    
    return {
      isValid,
      errors: isValid ? [] : ['Please provide a valid postal code']
    };
  },

  /**
   * Validate credit card number (Luhn algorithm)
   */
  validateCreditCardNumber: (cardNumber) => {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    
    // Check if it's all digits
    if (!/^\d+$/.test(cleanNumber)) {
      return { isValid: false, errors: ['Card number must contain only digits'] };
    }
    
    // Check length
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return { isValid: false, errors: ['Card number must be between 13 and 19 digits'] };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    const isValid = sum % 10 === 0;
    
    return {
      isValid,
      errors: isValid ? [] : ['Invalid card number']
    };
  },

  /**
   * Validate expiry date
   */
  validateExpiryDate: (month, year) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryDate = new Date(year, month - 1);
    const isValid = expiryDate > currentDate;
    
    return {
      isValid,
      errors: isValid ? [] : ['Card has expired']
    };
  },

  /**
   * Validate CVV
   */
  validateCvv: (cvv, cardType = 'unknown') => {
    let expectedLength;
    
    switch (cardType.toLowerCase()) {
      case 'amex':
        expectedLength = 4;
        break;
      default:
        expectedLength = 3;
    }
    
    const isValid = /^\d+$/.test(cvv) && cvv.length === expectedLength;
    
    return {
      isValid,
      errors: isValid ? [] : [`CVV must be ${expectedLength} digits`]
    };
  },

  /**
   * Validate date range
   */
  validateDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isValid = end > start;
    
    return {
      isValid,
      errors: isValid ? [] : ['End date must be after start date']
    };
  },

  /**
   * Validate age
   */
  validateAge: (birthDate, minAge = 13, maxAge = 120) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    const isValid = age >= minAge && age <= maxAge;
    
    return {
      isValid,
      errors: isValid ? [] : [`Age must be between ${minAge} and ${maxAge} years`]
    };
  },

  /**
   * Validate username format
   */
  validateUsername: (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const isValid = usernameRegex.test(username);
    
    return {
      isValid,
      errors: isValid ? [] : ['Username must be 3-20 characters and contain only letters, numbers, and underscores']
    };
  },

  /**
   * Validate strong password
   */
  validateStrongPassword: (password) => {
    const errors = [];
    
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }
    
    if (/(123|abc|qwe|password|admin)/i.test(password)) {
      errors.push('Password cannot contain common patterns');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitize input
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\w\s\-.,!?@#$%&*()]/g, '') // Remove special characters except common ones
      .replace(/\s+/g, ' '); // Normalize whitespace
  },

  /**
   * Validate object keys
   */
  validateObjectKeys: (obj, allowedKeys) => {
    const invalidKeys = Object.keys(obj).filter(key => !allowedKeys.includes(key));
    
    return {
      isValid: invalidKeys.length === 0,
      errors: invalidKeys.length > 0 ? [`Invalid keys: ${invalidKeys.join(', ')}`] : []
    };
  },

  /**
   * Validate required fields
   */
  validateRequiredFields: (obj, requiredFields) => {
    const missingFields = requiredFields.filter(field => !obj.hasOwnProperty(field) || obj[field] === null || obj[field] === undefined);
    
    return {
      isValid: missingFields.length === 0,
      errors: missingFields.length > 0 ? [`Missing required fields: ${missingFields.join(', ')}`] : []
    };
  }
};

/**
 * Async validation helpers
 */
const asyncValidators = {
  /**
   * Validate unique email
   */
  validateUniqueEmail: async (email, excludeId = null) => {
    const { User } = require('../../models');
    
    const whereClause = { email: email.toLowerCase() };
    if (excludeId) {
      whereClause.id = { [require('sequelize').Op.ne]: excludeId };
    }
    
    const existingUser = await User.findOne({ where: whereClause });
    
    return {
      isValid: !existingUser,
      errors: existingUser ? ['Email already exists'] : []
    };
  },

  /**
   * Validate unique SKU
   */
  validateUniqueSku: async (sku, excludeId = null) => {
    const { Product } = require('../../models');
    
    const whereClause = { sku: sku.toUpperCase() };
    if (excludeId) {
      whereClause.id = { [require('sequelize').Op.ne]: excludeId };
    }
    
    const existingProduct = await Product.findOne({ where: whereClause });
    
    return {
      isValid: !existingProduct,
      errors: existingProduct ? ['SKU already exists'] : []
    };
  },

  /**
   * Validate product exists
   */
  validateProductExists: async (productId) => {
    const { Product } = require('../../models');
    
    const product = await Product.findByPk(productId);
    
    return {
      isValid: !!product,
      errors: !product ? ['Product not found'] : []
    };
  },

  /**
   * Validate user exists
   */
  validateUserExists: async (userId) => {
    const { User } = require('../../models');
    
    const user = await User.findByPk(userId);
    
    return {
      isValid: !!user,
      errors: !user ? ['User not found'] : []
    };
  },

  /**
   * Validate order exists
   */
  validateOrderExists: async (orderId) => {
    const { Order } = require('../../models');
    
    const order = await Order.findByPk(orderId);
    
    return {
      isValid: !!order,
      errors: !order ? ['Order not found'] : []
    };
  },

  /**
   * Validate category exists
   */
  validateCategoryExists: async (categoryId) => {
    const { Category } = require('../../models');
    
    const category = await Category.findByPk(categoryId);
    
    return {
      isValid: !!category,
      errors: !category ? ['Category not found'] : []
    };
  }
};

module.exports = {
  commonSchemas,
  customValidators,
  asyncValidators
};
