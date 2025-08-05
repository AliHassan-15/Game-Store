const Joi = require('joi');

const userValidators = {
  // Update profile validation
  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Avatar must be a valid URL'
      })
  }),

  // Create address validation
  createAddress: Joi.object({
    type: Joi.string()
      .valid('shipping', 'billing', 'both')
      .default('both')
      .messages({
        'any.only': 'Address type must be one of: shipping, billing, both'
      }),
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    company: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Company name cannot exceed 100 characters'
      }),
    addressLine1: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Address line 1 must be at least 5 characters long',
        'string.max': 'Address line 1 cannot exceed 200 characters',
        'any.required': 'Address line 1 is required'
      }),
    addressLine2: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Address line 2 cannot exceed 200 characters'
      }),
    city: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'City must be at least 2 characters long',
        'string.max': 'City cannot exceed 100 characters',
        'any.required': 'City is required'
      }),
    state: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'State must be at least 2 characters long',
        'string.max': 'State cannot exceed 100 characters',
        'any.required': 'State is required'
      }),
    postalCode: Joi.string()
      .min(3)
      .max(20)
      .required()
      .messages({
        'string.min': 'Postal code must be at least 3 characters long',
        'string.max': 'Postal code cannot exceed 20 characters',
        'any.required': 'Postal code is required'
      }),
    country: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Country must be at least 2 characters long',
        'string.max': 'Country cannot exceed 100 characters',
        'any.required': 'Country is required'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    isDefault: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Is default must be a boolean'
      })
  }),

  // Update address validation
  updateAddress: Joi.object({
    addressId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Address ID must be a number',
        'number.integer': 'Address ID must be an integer',
        'number.positive': 'Address ID must be positive',
        'any.required': 'Address ID is required'
      }),
    type: Joi.string()
      .valid('shipping', 'billing', 'both')
      .optional()
      .messages({
        'any.only': 'Address type must be one of: shipping, billing, both'
      }),
    firstName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    company: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Company name cannot exceed 100 characters'
      }),
    addressLine1: Joi.string()
      .min(5)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Address line 1 must be at least 5 characters long',
        'string.max': 'Address line 1 cannot exceed 200 characters'
      }),
    addressLine2: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Address line 2 cannot exceed 200 characters'
      }),
    city: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'City must be at least 2 characters long',
        'string.max': 'City cannot exceed 100 characters'
      }),
    state: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'State must be at least 2 characters long',
        'string.max': 'State cannot exceed 100 characters'
      }),
    postalCode: Joi.string()
      .min(3)
      .max(20)
      .optional()
      .messages({
        'string.min': 'Postal code must be at least 3 characters long',
        'string.max': 'Postal code cannot exceed 20 characters'
      }),
    country: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Country must be at least 2 characters long',
        'string.max': 'Country cannot exceed 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    isDefault: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is default must be a boolean'
      })
  }),

  // Delete address validation
  deleteAddress: Joi.object({
    addressId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Address ID must be a number',
        'number.integer': 'Address ID must be an integer',
        'number.positive': 'Address ID must be positive',
        'any.required': 'Address ID is required'
      })
  }),

  // Set default address validation
  setDefaultAddress: Joi.object({
    addressId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Address ID must be a number',
        'number.integer': 'Address ID must be an integer',
        'number.positive': 'Address ID must be positive',
        'any.required': 'Address ID is required'
      })
  }),

  // Create payment method validation
  createPayment: Joi.object({
    type: Joi.string()
      .valid('credit_card', 'debit_card', 'paypal', 'bank_transfer')
      .required()
      .messages({
        'any.only': 'Payment type must be one of: credit_card, debit_card, paypal, bank_transfer',
        'any.required': 'Payment type is required'
      }),
    cardNumber: Joi.string()
      .pattern(/^[0-9]{13,19}$/)
      .when('type', {
        is: Joi.string().valid('credit_card', 'debit_card'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'string.pattern.base': 'Card number must be 13-19 digits',
        'any.required': 'Card number is required for card payments',
        'any.forbidden': 'Card number is not allowed for this payment type'
      }),
    expiryMonth: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .when('type', {
        is: Joi.string().valid('credit_card', 'debit_card'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'number.base': 'Expiry month must be a number',
        'number.integer': 'Expiry month must be an integer',
        'number.min': 'Expiry month must be between 1 and 12',
        'number.max': 'Expiry month must be between 1 and 12',
        'any.required': 'Expiry month is required for card payments',
        'any.forbidden': 'Expiry month is not allowed for this payment type'
      }),
    expiryYear: Joi.number()
      .integer()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 20)
      .when('type', {
        is: Joi.string().valid('credit_card', 'debit_card'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'number.base': 'Expiry year must be a number',
        'number.integer': 'Expiry year must be an integer',
        'number.min': 'Expiry year cannot be in the past',
        'number.max': 'Expiry year cannot be more than 20 years in the future',
        'any.required': 'Expiry year is required for card payments',
        'any.forbidden': 'Expiry year is not allowed for this payment type'
      }),
    cvv: Joi.string()
      .pattern(/^[0-9]{3,4}$/)
      .when('type', {
        is: Joi.string().valid('credit_card', 'debit_card'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'string.pattern.base': 'CVV must be 3-4 digits',
        'any.required': 'CVV is required for card payments',
        'any.forbidden': 'CVV is not allowed for this payment type'
      }),
    cardholderName: Joi.string()
      .min(2)
      .max(100)
      .when('type', {
        is: Joi.string().valid('credit_card', 'debit_card'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'string.min': 'Cardholder name must be at least 2 characters long',
        'string.max': 'Cardholder name cannot exceed 100 characters',
        'any.required': 'Cardholder name is required for card payments',
        'any.forbidden': 'Cardholder name is not allowed for this payment type'
      }),
    paypalEmail: Joi.string()
      .email()
      .when('type', {
        is: 'paypal',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'string.email': 'Please provide a valid PayPal email',
        'any.required': 'PayPal email is required for PayPal payments',
        'any.forbidden': 'PayPal email is not allowed for this payment type'
      }),
    bankAccountNumber: Joi.string()
      .pattern(/^[0-9]{8,17}$/)
      .when('type', {
        is: 'bank_transfer',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'string.pattern.base': 'Bank account number must be 8-17 digits',
        'any.required': 'Bank account number is required for bank transfers',
        'any.forbidden': 'Bank account number is not allowed for this payment type'
      }),
    bankRoutingNumber: Joi.string()
      .pattern(/^[0-9]{9}$/)
      .when('type', {
        is: 'bank_transfer',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'string.pattern.base': 'Bank routing number must be 9 digits',
        'any.required': 'Bank routing number is required for bank transfers',
        'any.forbidden': 'Bank routing number is not allowed for this payment type'
      }),
    isDefault: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Is default must be a boolean'
      })
  }),

  // Update payment method validation
  updatePayment: Joi.object({
    paymentId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Payment ID must be a number',
        'number.integer': 'Payment ID must be an integer',
        'number.positive': 'Payment ID must be positive',
        'any.required': 'Payment ID is required'
      }),
    cardholderName: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Cardholder name must be at least 2 characters long',
        'string.max': 'Cardholder name cannot exceed 100 characters'
      }),
    expiryMonth: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .optional()
      .messages({
        'number.base': 'Expiry month must be a number',
        'number.integer': 'Expiry month must be an integer',
        'number.min': 'Expiry month must be between 1 and 12',
        'number.max': 'Expiry month must be between 1 and 12'
      }),
    expiryYear: Joi.number()
      .integer()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 20)
      .optional()
      .messages({
        'number.base': 'Expiry year must be a number',
        'number.integer': 'Expiry year must be an integer',
        'number.min': 'Expiry year cannot be in the past',
        'number.max': 'Expiry year cannot be more than 20 years in the future'
      }),
    isDefault: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is default must be a boolean'
      })
  }),

  // Delete payment method validation
  deletePayment: Joi.object({
    paymentId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Payment ID must be a number',
        'number.integer': 'Payment ID must be an integer',
        'number.positive': 'Payment ID must be positive',
        'any.required': 'Payment ID is required'
      })
  }),

  // Set default payment method validation
  setDefaultPayment: Joi.object({
    paymentId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Payment ID must be a number',
        'number.integer': 'Payment ID must be an integer',
        'number.positive': 'Payment ID must be positive',
        'any.required': 'Payment ID is required'
      })
  }),

  // Get order stats validation
  getOrderStats: Joi.object({
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date'
      })
  }),

  // Get review stats validation
  getReviewStats: Joi.object({
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date'
      })
  }),

  // Get all users validation (admin)
  getAllUsers: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    role: Joi.string()
      .valid('buyer', 'admin')
      .optional()
      .messages({
        'any.only': 'Role must be either buyer or admin'
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .optional()
      .messages({
        'any.only': 'Status must be either active or inactive'
      }),
    search: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Search term must be at least 2 characters long',
        'string.max': 'Search term cannot exceed 100 characters'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'lastLogin', 'firstName', 'email')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, lastLogin, firstName, email'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Get user by ID validation (admin)
  getUserById: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
      })
  }),

  // Update user validation (admin)
  updateUser: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
      }),
    firstName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Avatar must be a valid URL'
      })
  }),

  // Delete user validation (admin)
  deleteUser: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
      })
  }),

  // Update user status validation (admin)
  updateUserStatus: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
      }),
    isActive: Joi.boolean()
      .required()
      .messages({
        'boolean.base': 'Is active must be a boolean',
        'any.required': 'Is active status is required'
      })
  }),

  // Update user role validation (admin)
  updateUserRole: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive',
        'any.required': 'User ID is required'
      }),
    role: Joi.string()
      .valid('buyer', 'admin')
      .required()
      .messages({
        'any.only': 'Role must be either buyer or admin',
        'any.required': 'Role is required'
      })
  }),

  // Get registration stats validation (admin)
  getRegistrationStats: Joi.object({
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date'
      }),
    groupBy: Joi.string()
      .valid('day', 'week', 'month', 'year')
      .default('day')
      .messages({
        'any.only': 'Group by must be one of: day, week, month, year'
      })
  }),

  // Get activity stats validation (admin)
  getActivityStats: Joi.object({
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date'
      }),
    activityType: Joi.string()
      .valid('login', 'order', 'review', 'profile_update')
      .optional()
      .messages({
        'any.only': 'Activity type must be one of: login, order, review, profile_update'
      })
  }),

  // Export users validation (admin)
  exportUsers: Joi.object({
    startDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date'
      }),
    role: Joi.string()
      .valid('buyer', 'admin')
      .optional()
      .messages({
        'any.only': 'Role must be either buyer or admin'
      }),
    status: Joi.string()
      .valid('active', 'inactive')
      .optional()
      .messages({
        'any.only': 'Status must be either active or inactive'
      }),
    format: Joi.string()
      .valid('excel', 'csv')
      .default('excel')
      .messages({
        'any.only': 'Format must be either excel or csv'
      })
  })
};

module.exports = { userValidators };
