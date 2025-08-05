const Joi = require('joi');

const reviewValidators = {
  // Get product reviews validation
  getProductReviews: Joi.object({
    productId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      }),
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
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional()
      .messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'rating', 'helpful')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, rating, helpful'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Get my reviews validation
  getMyReviews: Joi.object({
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
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional()
      .messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'rating', 'helpful')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, rating, helpful'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Create review validation
  createReview: Joi.object({
    productId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      }),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5',
        'any.required': 'Rating is required'
      }),
    title: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Review title must be at least 5 characters long',
        'string.max': 'Review title cannot exceed 200 characters',
        'any.required': 'Review title is required'
      }),
    comment: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Review comment must be at least 10 characters long',
        'string.max': 'Review comment cannot exceed 1000 characters',
        'any.required': 'Review comment is required'
      }),
    images: Joi.array()
      .items(Joi.string().uri())
      .max(5)
      .optional()
      .messages({
        'array.max': 'Cannot upload more than 5 images',
        'string.uri': 'Image must be a valid URL'
      }),
    pros: Joi.array()
      .items(Joi.string().min(2).max(100))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 pros',
        'string.min': 'Pro must be at least 2 characters',
        'string.max': 'Pro cannot exceed 100 characters'
      }),
    cons: Joi.array()
      .items(Joi.string().min(2).max(100))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 cons',
        'string.min': 'Con must be at least 2 characters',
        'string.max': 'Con cannot exceed 100 characters'
      }),
    isVerifiedPurchase: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Is verified purchase must be a boolean'
      })
  }),

  // Update review validation
  updateReview: Joi.object({
    reviewId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Review ID must be a number',
        'number.integer': 'Review ID must be an integer',
        'number.positive': 'Review ID must be positive',
        'any.required': 'Review ID is required'
      }),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional()
      .messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5'
      }),
    title: Joi.string()
      .min(5)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Review title must be at least 5 characters long',
        'string.max': 'Review title cannot exceed 200 characters'
      }),
    comment: Joi.string()
      .min(10)
      .max(1000)
      .optional()
      .messages({
        'string.min': 'Review comment must be at least 10 characters long',
        'string.max': 'Review comment cannot exceed 1000 characters'
      }),
    images: Joi.array()
      .items(Joi.string().uri())
      .max(5)
      .optional()
      .messages({
        'array.max': 'Cannot upload more than 5 images',
        'string.uri': 'Image must be a valid URL'
      }),
    pros: Joi.array()
      .items(Joi.string().min(2).max(100))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 pros',
        'string.min': 'Pro must be at least 2 characters',
        'string.max': 'Pro cannot exceed 100 characters'
      }),
    cons: Joi.array()
      .items(Joi.string().min(2).max(100))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 cons',
        'string.min': 'Con must be at least 2 characters',
        'string.max': 'Con cannot exceed 100 characters'
      })
  }),

  // Delete review validation
  deleteReview: Joi.object({
    reviewId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Review ID must be a number',
        'number.integer': 'Review ID must be an integer',
        'number.positive': 'Review ID must be positive',
        'any.required': 'Review ID is required'
      })
  }),

  // Report review validation
  reportReview: Joi.object({
    reviewId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Review ID must be a number',
        'number.integer': 'Review ID must be an integer',
        'number.positive': 'Review ID must be positive',
        'any.required': 'Review ID is required'
      }),
    reason: Joi.string()
      .valid('inappropriate', 'spam', 'fake', 'offensive', 'other')
      .required()
      .messages({
        'any.only': 'Reason must be one of: inappropriate, spam, fake, offensive, other',
        'any.required': 'Reason is required'
      }),
    description: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 500 characters',
        'any.required': 'Description is required'
      })
  }),

  // Mark review as helpful validation
  markHelpful: Joi.object({
    reviewId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Review ID must be a number',
        'number.integer': 'Review ID must be an integer',
        'number.positive': 'Review ID must be positive',
        'any.required': 'Review ID is required'
      }),
    isHelpful: Joi.boolean()
      .required()
      .messages({
        'boolean.base': 'Is helpful must be a boolean',
        'any.required': 'Is helpful status is required'
      })
  }),

  // Get all reviews validation (admin)
  getAllReviews: Joi.object({
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
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional()
      .messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5'
      }),
    status: Joi.string()
      .valid('pending', 'approved', 'rejected', 'reported')
      .optional()
      .messages({
        'any.only': 'Status must be one of: pending, approved, rejected, reported'
      }),
    productId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive'
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
      .valid('createdAt', 'rating', 'helpful', 'reports')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, rating, helpful, reports'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Get review by ID validation (admin)
  getReviewById: Joi.object({
    reviewId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Review ID must be a number',
        'number.integer': 'Review ID must be an integer',
        'number.positive': 'Review ID must be positive',
        'any.required': 'Review ID is required'
      })
  }),

  // Update review status validation (admin)
  updateReviewStatus: Joi.object({
    reviewId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Review ID must be a number',
        'number.integer': 'Review ID must be an integer',
        'number.positive': 'Review ID must be positive',
        'any.required': 'Review ID is required'
      }),
    status: Joi.string()
      .valid('pending', 'approved', 'rejected')
      .required()
      .messages({
        'any.only': 'Status must be one of: pending, approved, rejected',
        'any.required': 'Status is required'
      }),
    adminNotes: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Admin notes cannot exceed 500 characters'
      })
  }),

  // Get reported reviews validation (admin)
  getReportedReviews: Joi.object({
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
    reason: Joi.string()
      .valid('inappropriate', 'spam', 'fake', 'offensive', 'other')
      .optional()
      .messages({
        'any.only': 'Reason must be one of: inappropriate, spam, fake, offensive, other'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'reports', 'rating')
      .default('reports')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, reports, rating'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Get review statistics validation (admin)
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
      }),
    groupBy: Joi.string()
      .valid('day', 'week', 'month', 'year')
      .default('day')
      .messages({
        'any.only': 'Group by must be one of: day, week, month, year'
      })
  }),

  // Get rating distribution validation (admin)
  getRatingDistribution: Joi.object({
    productId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive'
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

  // Export reviews validation (admin)
  exportReviews: Joi.object({
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
    status: Joi.string()
      .valid('pending', 'approved', 'rejected', 'reported')
      .optional()
      .messages({
        'any.only': 'Status must be one of: pending, approved, rejected, reported'
      }),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional()
      .messages({
        'number.base': 'Rating must be a number',
        'number.integer': 'Rating must be an integer',
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5'
      }),
    format: Joi.string()
      .valid('excel', 'csv')
      .default('excel')
      .messages({
        'any.only': 'Format must be either excel or csv'
      })
  })
};

module.exports = { reviewValidators };
