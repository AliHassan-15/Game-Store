const Joi = require('joi');

const adminValidators = {
  // Get dashboard overview validation
  getDashboardOverview: Joi.object({
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

  // Get sales analytics validation
  getSalesAnalytics: Joi.object({
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
      }),
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive'
      })
  }),

  // Get user analytics validation
  getUserAnalytics: Joi.object({
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

  // Get product analytics validation
  getProductAnalytics: Joi.object({
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
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      })
  }),

  // Get inventory analytics validation
  getInventoryAnalytics: Joi.object({
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive'
      }),
    status: Joi.string()
      .valid('in_stock', 'low_stock', 'out_of_stock')
      .optional()
      .messages({
        'any.only': 'Status must be one of: in_stock, low_stock, out_of_stock'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      })
  }),

  // Get system overview validation
  getSystemOverview: Joi.object({
    includeDetails: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Include details must be a boolean'
      })
  }),

  // Get activity logs validation
  getActivityLogs: Joi.object({
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
    action: Joi.string()
      .valid('create', 'update', 'delete', 'login', 'logout', 'order', 'payment', 'review')
      .optional()
      .messages({
        'any.only': 'Action must be one of: create, update, delete, login, logout, order, payment, review'
      }),
    userId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
      }),
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
    sortBy: Joi.string()
      .valid('createdAt', 'action', 'userId')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, action, userId'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Export activity logs validation
  exportActivityLogs: Joi.object({
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
    action: Joi.string()
      .valid('create', 'update', 'delete', 'login', 'logout', 'order', 'payment', 'review')
      .optional()
      .messages({
        'any.only': 'Action must be one of: create, update, delete, login, logout, order, payment, review'
      }),
    userId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
      }),
    format: Joi.string()
      .valid('excel', 'csv')
      .default('excel')
      .messages({
        'any.only': 'Format must be either excel or csv'
      })
  }),

  // Get system health validation
  getSystemHealth: Joi.object({
    includeDetails: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Include details must be a boolean'
      })
  }),

  // Get performance metrics validation
  getPerformanceMetrics: Joi.object({
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
      .valid('hour', 'day', 'week', 'month')
      .default('day')
      .messages({
        'any.only': 'Group by must be one of: hour, day, week, month'
      })
  }),

  // Get error logs validation
  getErrorLogs: Joi.object({
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
    level: Joi.string()
      .valid('error', 'warn', 'info', 'debug')
      .optional()
      .messages({
        'any.only': 'Level must be one of: error, warn, info, debug'
      }),
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
    sortBy: Joi.string()
      .valid('timestamp', 'level', 'message')
      .default('timestamp')
      .messages({
        'any.only': 'Sort by must be one of: timestamp, level, message'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Clear logs validation
  clearLogs: Joi.object({
    type: Joi.string()
      .valid('activity', 'error', 'all')
      .required()
      .messages({
        'any.only': 'Type must be one of: activity, error, all',
        'any.required': 'Type is required'
      }),
    beforeDate: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Before date must be a valid date',
        'date.format': 'Before date must be in ISO format'
      })
  }),

  // Get backup status validation
  getBackupStatus: Joi.object({
    includeDetails: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Include details must be a boolean'
      })
  }),

  // Create backup validation
  createBackup: Joi.object({
    type: Joi.string()
      .valid('full', 'database', 'files')
      .default('full')
      .messages({
        'any.only': 'Type must be one of: full, database, files'
      }),
    description: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      })
  }),

  // Restore backup validation
  restoreBackup: Joi.object({
    backupId: Joi.string()
      .required()
      .messages({
        'any.required': 'Backup ID is required'
      }),
    confirm: Joi.boolean()
      .valid(true)
      .required()
      .messages({
        'any.only': 'You must confirm the restore operation',
        'any.required': 'Confirmation is required'
      })
  }),

  // Get system settings validation
  getSystemSettings: Joi.object({
    category: Joi.string()
      .valid('general', 'email', 'payment', 'security', 'notifications')
      .optional()
      .messages({
        'any.only': 'Category must be one of: general, email, payment, security, notifications'
      })
  }),

  // Update system settings validation
  updateSystemSettings: Joi.object({
    category: Joi.string()
      .valid('general', 'email', 'payment', 'security', 'notifications')
      .required()
      .messages({
        'any.only': 'Category must be one of: general, email, payment, security, notifications',
        'any.required': 'Category is required'
      }),
    settings: Joi.object()
      .required()
      .messages({
        'any.required': 'Settings object is required'
      })
  }),

  // Get API usage validation
  getApiUsage: Joi.object({
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
    endpoint: Joi.string()
      .optional()
      .messages({
        'string.base': 'Endpoint must be a string'
      }),
    userId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
      }),
    groupBy: Joi.string()
      .valid('hour', 'day', 'week', 'month')
      .default('day')
      .messages({
        'any.only': 'Group by must be one of: hour, day, week, month'
      })
  }),

  // Get rate limit status validation
  getRateLimitStatus: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
      }),
    ipAddress: Joi.string()
      .ip()
      .optional()
      .messages({
        'string.ip': 'IP address must be a valid IP address'
      })
  }),

  // Reset rate limit validation
  resetRateLimit: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
      }),
    ipAddress: Joi.string()
      .ip()
      .optional()
      .messages({
        'string.ip': 'IP address must be a valid IP address'
      }),
    confirm: Joi.boolean()
      .valid(true)
      .required()
      .messages({
        'any.only': 'You must confirm the reset operation',
        'any.required': 'Confirmation is required'
      })
  })
};

module.exports = { adminValidators }; 