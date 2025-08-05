const Joi = require('joi');

const orderValidators = {
  createFromCart: Joi.object({
    shippingAddressId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Shipping address ID must be a number',
        'number.integer': 'Shipping address ID must be an integer',
        'number.positive': 'Shipping address ID must be positive',
        'any.required': 'Shipping address ID is required'
      }),
    billingAddressId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Billing address ID must be a number',
        'number.integer': 'Billing address ID must be an integer',
        'number.positive': 'Billing address ID must be positive'
      }),
    paymentMethodId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Payment method ID must be a number',
        'number.integer': 'Payment method ID must be an integer',
        'number.positive': 'Payment method ID must be positive'
      }),
    notes: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Order notes cannot exceed 500 characters'
      }),
    couponCode: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[A-Z0-9]+$/)
      .optional()
      .messages({
        'string.min': 'Coupon code must be at least 3 characters long',
        'string.max': 'Coupon code cannot exceed 20 characters',
        'string.pattern.base': 'Coupon code can only contain uppercase letters and numbers'
      })
  }),

  // Get my orders validation
  getMyOrders: Joi.object({
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
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      }),
    status: Joi.string()
      .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
      .optional()
      .messages({
        'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled, refunded'
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
      })
  }),

  // Get my order by ID validation
  getMyOrderById: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      })
  }),

  // Cancel order validation
  cancelOrder: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      })
  }),

  // Request refund validation
  requestRefund: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      }),
    reason: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Refund reason must be at least 10 characters long',
        'string.max': 'Refund reason cannot exceed 500 characters',
        'any.required': 'Refund reason is required'
      }),
    items: Joi.array()
      .items(Joi.object({
        orderItemId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        reason: Joi.string().min(5).max(200).required()
      }))
      .min(1)
      .optional()
      .messages({
        'array.min': 'At least one item must be specified for refund'
      })
  }),

  // Get all orders validation (admin)
  getAllOrders: Joi.object({
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
    status: Joi.string()
      .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
      .optional()
      .messages({
        'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled, refunded'
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
      .valid('createdAt', 'total', 'status', 'userId')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, total, status, userId'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Get order by ID validation (admin)
  getOrderById: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      })
  }),

  // Update order status validation (admin)
  updateOrderStatus: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      }),
    status: Joi.string()
      .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
      .required()
      .messages({
        'any.only': 'Status must be one of: pending, processing, shipped, delivered, cancelled, refunded',
        'any.required': 'Status is required'
      }),
    notes: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Status notes cannot exceed 500 characters'
      })
  }),

  // Update shipping info validation (admin)
  updateShippingInfo: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      }),
    trackingNumber: Joi.string()
      .min(5)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Tracking number must be at least 5 characters long',
        'string.max': 'Tracking number cannot exceed 50 characters'
      }),
    shippingCarrier: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Shipping carrier must be at least 2 characters long',
        'string.max': 'Shipping carrier cannot exceed 50 characters'
      }),
    estimatedDelivery: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Estimated delivery must be a valid date',
        'date.format': 'Estimated delivery must be in ISO format'
      })
  }),

  // Process refund validation (admin)
  processRefund: Joi.object({
    orderId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Order ID must be a number',
        'number.integer': 'Order ID must be an integer',
        'number.positive': 'Order ID must be positive',
        'any.required': 'Order ID is required'
      }),
    refundAmount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.base': 'Refund amount must be a number',
        'number.positive': 'Refund amount must be positive',
        'number.precision': 'Refund amount can have maximum 2 decimal places',
        'any.required': 'Refund amount is required'
      }),
    reason: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Refund reason must be at least 5 characters long',
        'string.max': 'Refund reason cannot exceed 200 characters',
        'any.required': 'Refund reason is required'
      }),
    refundMethod: Joi.string()
      .valid('original_payment', 'store_credit', 'bank_transfer')
      .default('original_payment')
      .messages({
        'any.only': 'Refund method must be one of: original_payment, store_credit, bank_transfer'
      })
  }),

  // Order statistics validation (admin)
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
      }),
    groupBy: Joi.string()
      .valid('day', 'week', 'month', 'year')
      .default('day')
      .messages({
        'any.only': 'Group by must be one of: day, week, month, year'
      })
  }),

  // Revenue statistics validation (admin)
  getRevenueStats: Joi.object({
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

  // Status statistics validation (admin)
  getStatusStats: Joi.object({
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

  // Get orders by status validation (admin)
  getPendingOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  getProcessingOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  getShippedOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  getDeliveredOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  getCancelledOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  getRefundedOrders: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // Export orders validation (admin)
  exportOrders: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded').optional(),
    format: Joi.string().valid('excel', 'csv').default('excel')
  }),

  // Track order validation (public)
  trackOrder: Joi.object({
    trackingNumber: Joi.string()
      .min(5)
      .max(50)
      .required()
      .messages({
        'string.min': 'Tracking number must be at least 5 characters long',
        'string.max': 'Tracking number cannot exceed 50 characters',
        'any.required': 'Tracking number is required'
      })
  })
};

module.exports = { orderValidators };
