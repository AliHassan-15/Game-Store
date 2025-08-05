const Joi = require('joi');

const uploadValidators = {
  uploadProductImage: Joi.object({
    productId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive'
      }),
    isPrimary: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Is primary must be a boolean'
      }),
    altText: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Alt text cannot exceed 200 characters'
      }),
    caption: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Caption cannot exceed 500 characters'
      })
  }),

  // Upload multiple product images validation
  uploadMultipleProductImages: Joi.object({
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
    images: Joi.array()
      .items(Joi.object({
        isPrimary: Joi.boolean().default(false),
        altText: Joi.string().max(200).optional(),
        caption: Joi.string().max(500).optional()
      }))
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'At least one image is required',
        'array.max': 'Cannot upload more than 10 images',
        'any.required': 'Images array is required'
      })
  }),

  // Upload user avatar validation
  uploadUserAvatar: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'User ID must be a number',
        'number.integer': 'User ID must be an integer',
        'number.positive': 'User ID must be positive'
      }),
    altText: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Alt text cannot exceed 200 characters'
      })
  }),

  // Upload category image validation
  uploadCategoryImage: Joi.object({
    categoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category ID is required'
      }),
    altText: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Alt text cannot exceed 200 characters'
      })
  }),

  // Upload subcategory image validation
  uploadSubCategoryImage: Joi.object({
    categoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category ID is required'
      }),
    subCategoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Subcategory ID must be a number',
        'number.integer': 'Subcategory ID must be an integer',
        'number.positive': 'Subcategory ID must be positive',
        'any.required': 'Subcategory ID is required'
      }),
    altText: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Alt text cannot exceed 200 characters'
      })
  }),

  // Upload general document validation
  uploadDocument: Joi.object({
    type: Joi.string()
      .valid('document', 'spreadsheet', 'presentation', 'pdf', 'other')
      .default('document')
      .messages({
        'any.only': 'Type must be one of: document, spreadsheet, presentation, pdf, other'
      }),
    category: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Category must be at least 2 characters long',
        'string.max': 'Category cannot exceed 50 characters'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 tags',
        'string.min': 'Tag must be at least 1 character',
        'string.max': 'Tag cannot exceed 50 characters'
      }),
    isPublic: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Is public must be a boolean'
      })
  }),

  // Upload Excel file validation
  uploadExcel: Joi.object({
    type: Joi.string()
      .valid('products', 'categories', 'users', 'orders', 'custom')
      .required()
      .messages({
        'any.only': 'Type must be one of: products, categories, users, orders, custom',
        'any.required': 'Type is required'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    overwrite: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Overwrite must be a boolean'
      }),
    validateOnly: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Validate only must be a boolean'
      })
  }),

  // Delete file validation
  deleteFile: Joi.object({
    fileId: Joi.string()
      .required()
      .messages({
        'any.required': 'File ID is required'
      }),
    confirm: Joi.boolean()
      .valid(true)
      .optional()
      .messages({
        'any.only': 'You must confirm the deletion'
      })
  }),

  // Get file info validation
  getFileInfo: Joi.object({
    fileId: Joi.string()
      .required()
      .messages({
        'any.required': 'File ID is required'
      })
  }),

  // List files validation
  listFiles: Joi.object({
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
    type: Joi.string()
      .valid('image', 'document', 'spreadsheet', 'presentation', 'pdf', 'other')
      .optional()
      .messages({
        'any.only': 'Type must be one of: image, document, spreadsheet, presentation, pdf, other'
      }),
    category: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Category must be at least 2 characters long',
        'string.max': 'Category cannot exceed 50 characters'
      }),
    uploadedBy: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Uploaded by must be a number',
        'number.integer': 'Uploaded by must be an integer',
        'number.positive': 'Uploaded by must be positive'
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
      .valid('createdAt', 'name', 'size', 'type')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: createdAt, name, size, type'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  }),

  // Search files validation
  searchFiles: Joi.object({
    query: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Search query must be at least 1 character',
        'string.max': 'Search query cannot exceed 100 characters',
        'any.required': 'Search query is required'
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
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    type: Joi.string()
      .valid('image', 'document', 'spreadsheet', 'presentation', 'pdf', 'other')
      .optional()
      .messages({
        'any.only': 'Type must be one of: image, document, spreadsheet, presentation, pdf, other'
      }),
    category: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Category must be at least 2 characters long',
        'string.max': 'Category cannot exceed 50 characters'
      })
  }),

  // Get upload statistics validation
  getUploadStats: Joi.object({
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
    type: Joi.string()
      .valid('image', 'document', 'spreadsheet', 'presentation', 'pdf', 'other')
      .optional()
      .messages({
        'any.only': 'Type must be one of: image, document, spreadsheet, presentation, pdf, other'
      })
  }),

  // Cleanup orphaned files validation
  cleanupOrphanedFiles: Joi.object({
    dryRun: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'Dry run must be a boolean'
      }),
    olderThan: Joi.number()
      .integer()
      .min(1)
      .default(30)
      .messages({
        'number.base': 'Older than must be a number',
        'number.integer': 'Older than must be an integer',
        'number.min': 'Older than must be at least 1 day'
      }),
    type: Joi.string()
      .valid('image', 'document', 'spreadsheet', 'presentation', 'pdf', 'other', 'all')
      .default('all')
      .messages({
        'any.only': 'Type must be one of: image, document, spreadsheet, presentation, pdf, other, all'
      }),
    confirm: Joi.boolean()
      .valid(true)
      .when('dryRun', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.only': 'You must confirm the cleanup operation',
        'any.required': 'Confirmation is required when not in dry run mode'
      })
  }),

  // Get storage usage validation
  getStorageUsage: Joi.object({
    includeDetails: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Include details must be a boolean'
      }),
    byUser: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'By user must be a boolean'
      }),
    byType: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'By type must be a boolean'
      })
  }),

  // Update file metadata validation
  updateFileMetadata: Joi.object({
    fileId: Joi.string()
      .required()
      .messages({
        'any.required': 'File ID is required'
      }),
    name: Joi.string()
      .min(1)
      .max(255)
      .optional()
      .messages({
        'string.min': 'Name must be at least 1 character long',
        'string.max': 'Name cannot exceed 255 characters'
      }),
    altText: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Alt text cannot exceed 200 characters'
      }),
    caption: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Caption cannot exceed 500 characters'
      }),
    description: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(20)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 20 tags',
        'string.min': 'Tag must be at least 1 character',
        'string.max': 'Tag cannot exceed 50 characters'
      }),
    category: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Category must be at least 2 characters long',
        'string.max': 'Category cannot exceed 50 characters'
      }),
    isPublic: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is public must be a boolean'
      })
  }),

  // Download file validation
  downloadFile: Joi.object({
    fileId: Joi.string()
      .required()
      .messages({
        'any.required': 'File ID is required'
      }),
    format: Joi.string()
      .valid('original', 'thumbnail', 'preview')
      .default('original')
      .messages({
        'any.only': 'Format must be one of: original, thumbnail, preview'
      }),
    quality: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(90)
      .when('format', {
        is: Joi.string().valid('thumbnail', 'preview'),
        then: Joi.optional(),
        otherwise: Joi.forbidden()
      })
      .messages({
        'number.base': 'Quality must be a number',
        'number.integer': 'Quality must be an integer',
        'number.min': 'Quality must be between 1 and 100',
        'number.max': 'Quality must be between 1 and 100',
        'any.forbidden': 'Quality is only allowed for thumbnail and preview formats'
      })
  }),

  // Generate file URL validation
  generateFileUrl: Joi.object({
    fileId: Joi.string()
      .required()
      .messages({
        'any.required': 'File ID is required'
      }),
    expiresIn: Joi.number()
      .integer()
      .min(60)
      .max(86400)
      .default(3600)
      .messages({
        'number.base': 'Expires in must be a number',
        'number.integer': 'Expires in must be an integer',
        'number.min': 'Expires in must be at least 60 seconds',
        'number.max': 'Expires in cannot exceed 86400 seconds (24 hours)'
      }),
    format: Joi.string()
      .valid('original', 'thumbnail', 'preview')
      .default('original')
      .messages({
        'any.only': 'Format must be one of: original, thumbnail, preview'
      })
  })
};

module.exports = { uploadValidators }; 