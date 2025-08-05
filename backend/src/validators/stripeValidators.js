const Joi = require('joi');

/**
 * Stripe Validation Schemas
 */

const stripeValidators = {
  // Create payment intent validation
  createPaymentIntent: Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'number.precision': 'Amount can have maximum 2 decimal places',
        'any.required': 'Amount is required'
      }),
    currency: Joi.string()
      .length(3)
      .uppercase()
      .default('usd')
      .messages({
        'string.length': 'Currency must be 3 characters long',
        'string.uppercase': 'Currency must be uppercase'
      }),
    paymentMethodTypes: Joi.array()
      .items(Joi.string().valid('card', 'sepa_debit', 'sofort', 'ideal', 'bancontact'))
      .min(1)
      .default(['card'])
      .messages({
        'array.min': 'At least one payment method type is required',
        'any.only': 'Payment method type must be one of: card, sepa_debit, sofort, ideal, bancontact'
      }),
    customerId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Customer ID must be a string'
      }),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    receiptEmail: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Receipt email must be a valid email address'
      }),
    applicationFeeAmount: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Application fee amount must be a number',
        'number.positive': 'Application fee amount must be positive',
        'number.precision': 'Application fee amount can have maximum 2 decimal places'
      })
  }),

  // Confirm payment intent validation
  confirmPaymentIntent: Joi.object({
    paymentIntentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment intent ID is required'
      }),
    paymentMethodId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Payment method ID must be a string'
      }),
    returnUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Return URL must be a valid URL'
      }),
    setupFutureUsage: Joi.string()
      .valid('off_session', 'on_session')
      .optional()
      .messages({
        'any.only': 'Setup future usage must be either off_session or on_session'
      }),
    offSession: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Off session must be a boolean'
      })
  }),

  // Get payment intent validation
  getPaymentIntent: Joi.object({
    paymentIntentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment intent ID is required'
      })
  }),

  // Create customer validation
  createCustomer: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    address: Joi.object({
      line1: Joi.string().min(5).max(200).required(),
      line2: Joi.string().max(200).optional(),
      city: Joi.string().min(2).max(100).required(),
      state: Joi.string().min(2).max(100).required(),
      postal_code: Joi.string().min(3).max(20).required(),
      country: Joi.string().length(2).uppercase().required()
    }).optional(),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      })
  }),

  // Update customer validation
  updateCustomer: Joi.object({
    customerId: Joi.string()
      .required()
      .messages({
        'any.required': 'Customer ID is required'
      }),
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Email must be a valid email address'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    address: Joi.object({
      line1: Joi.string().min(5).max(200).optional(),
      line2: Joi.string().max(200).optional(),
      city: Joi.string().min(2).max(100).optional(),
      state: Joi.string().min(2).max(100).optional(),
      postal_code: Joi.string().min(3).max(20).optional(),
      country: Joi.string().length(2).uppercase().optional()
    }).optional(),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      })
  }),

  // Get customer validation
  getCustomer: Joi.object({
    customerId: Joi.string()
      .required()
      .messages({
        'any.required': 'Customer ID is required'
      })
  }),

  // Delete customer validation
  deleteCustomer: Joi.object({
    customerId: Joi.string()
      .required()
      .messages({
        'any.required': 'Customer ID is required'
      })
  }),

  // Create payment method validation
  createPaymentMethod: Joi.object({
    type: Joi.string()
      .valid('card', 'sepa_debit', 'sofort', 'ideal', 'bancontact')
      .required()
      .messages({
        'any.only': 'Type must be one of: card, sepa_debit, sofort, ideal, bancontact',
        'any.required': 'Type is required'
      }),
    card: Joi.object({
      number: Joi.string()
        .pattern(/^[0-9]{13,19}$/)
        .when('type', {
          is: 'card',
          then: Joi.required(),
          otherwise: Joi.forbidden()
        })
        .messages({
          'string.pattern.base': 'Card number must be 13-19 digits',
          'any.required': 'Card number is required for card payments',
          'any.forbidden': 'Card number is not allowed for this payment type'
        }),
      expMonth: Joi.number()
        .integer()
        .min(1)
        .max(12)
        .when('type', {
          is: 'card',
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
      expYear: Joi.number()
        .integer()
        .min(new Date().getFullYear())
        .max(new Date().getFullYear() + 20)
        .when('type', {
          is: 'card',
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
      cvc: Joi.string()
        .pattern(/^[0-9]{3,4}$/)
        .when('type', {
          is: 'card',
          then: Joi.required(),
          otherwise: Joi.forbidden()
        })
        .messages({
          'string.pattern.base': 'CVC must be 3-4 digits',
          'any.required': 'CVC is required for card payments',
          'any.forbidden': 'CVC is not allowed for this payment type'
        })
    }).when('type', {
      is: 'card',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    billingDetails: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 100 characters'
        }),
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': 'Email must be a valid email address'
        }),
      phone: Joi.string()
        .pattern(/^\+?[\d\s\-\(\)]+$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number'
        }),
      address: Joi.object({
        line1: Joi.string().min(5).max(200).optional(),
        line2: Joi.string().max(200).optional(),
        city: Joi.string().min(2).max(100).optional(),
        state: Joi.string().min(2).max(100).optional(),
        postal_code: Joi.string().min(3).max(20).optional(),
        country: Joi.string().length(2).uppercase().optional()
      }).optional()
    }).optional(),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      })
  }),

  // Attach payment method validation
  attachPaymentMethod: Joi.object({
    paymentMethodId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment method ID is required'
      }),
    customerId: Joi.string()
      .required()
      .messages({
        'any.required': 'Customer ID is required'
      })
  }),

  // Detach payment method validation
  detachPaymentMethod: Joi.object({
    paymentMethodId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment method ID is required'
      })
  }),

  // Get payment method validation
  getPaymentMethod: Joi.object({
    paymentMethodId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment method ID is required'
      })
  }),

  // Update payment method validation
  updatePaymentMethod: Joi.object({
    paymentMethodId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment method ID is required'
      }),
    billingDetails: Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
          'string.min': 'Name must be at least 2 characters long',
          'string.max': 'Name cannot exceed 100 characters'
        }),
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': 'Email must be a valid email address'
        }),
      phone: Joi.string()
        .pattern(/^\+?[\d\s\-\(\)]+$/)
        .optional()
        .messages({
          'string.pattern.base': 'Please provide a valid phone number'
        }),
      address: Joi.object({
        line1: Joi.string().min(5).max(200).optional(),
        line2: Joi.string().max(200).optional(),
        city: Joi.string().min(2).max(100).optional(),
        state: Joi.string().min(2).max(100).optional(),
        postal_code: Joi.string().min(3).max(20).optional(),
        country: Joi.string().length(2).uppercase().optional()
      }).optional()
    }).optional(),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      })
  }),

  // List payment methods validation
  listPaymentMethods: Joi.object({
    customerId: Joi.string()
      .required()
      .messages({
        'any.required': 'Customer ID is required'
      }),
    type: Joi.string()
      .valid('card', 'sepa_debit', 'sofort', 'ideal', 'bancontact')
      .optional()
      .messages({
        'any.only': 'Type must be one of: card, sepa_debit, sofort, ideal, bancontact'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  }),

  // Create refund validation
  createRefund: Joi.object({
    paymentIntentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment intent ID is required'
      }),
    amount: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'number.precision': 'Amount can have maximum 2 decimal places'
      }),
    reason: Joi.string()
      .valid('duplicate', 'fraudulent', 'requested_by_customer')
      .optional()
      .messages({
        'any.only': 'Reason must be one of: duplicate, fraudulent, requested_by_customer'
      }),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      }),
    refundApplicationFee: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Refund application fee must be a boolean'
      }),
    reverseTransfer: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Reverse transfer must be a boolean'
      })
  }),

  // Get refund validation
  getRefund: Joi.object({
    refundId: Joi.string()
      .required()
      .messages({
        'any.required': 'Refund ID is required'
      })
  }),

  // List refunds validation
  listRefunds: Joi.object({
    paymentIntentId: Joi.string()
      .optional()
      .messages({
        'string.base': 'Payment intent ID must be a string'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    startingAfter: Joi.string()
      .optional()
      .messages({
        'string.base': 'Starting after must be a string'
      }),
    endingBefore: Joi.string()
      .optional()
      .messages({
        'string.base': 'Ending before must be a string'
      })
  }),

  // Cancel payment intent validation
  cancelPaymentIntent: Joi.object({
    paymentIntentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment intent ID is required'
      }),
    cancellationReason: Joi.string()
      .valid('duplicate', 'fraudulent', 'requested_by_customer', 'abandoned')
      .optional()
      .messages({
        'any.only': 'Cancellation reason must be one of: duplicate, fraudulent, requested_by_customer, abandoned'
      })
  }),

  // Capture payment intent validation
  capturePaymentIntent: Joi.object({
    paymentIntentId: Joi.string()
      .required()
      .messages({
        'any.required': 'Payment intent ID is required'
      }),
    amountToCapture: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Amount to capture must be a number',
        'number.positive': 'Amount to capture must be positive',
        'number.precision': 'Amount to capture can have maximum 2 decimal places'
      }),
    applicationFeeAmount: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Application fee amount must be a number',
        'number.positive': 'Application fee amount must be positive',
        'number.precision': 'Application fee amount can have maximum 2 decimal places'
      }),
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      }),
    statementDescriptor: Joi.string()
      .max(22)
      .optional()
      .messages({
        'string.max': 'Statement descriptor cannot exceed 22 characters'
      }),
    statementDescriptorSuffix: Joi.string()
      .max(22)
      .optional()
      .messages({
        'string.max': 'Statement descriptor suffix cannot exceed 22 characters'
      })
  })
};

module.exports = { stripeValidators }; 