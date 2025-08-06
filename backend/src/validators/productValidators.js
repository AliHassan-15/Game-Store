const Joi = require('joi');

const productValidators = {
  getProducts: Joi.object({
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
    sortBy: Joi.string()
      .valid('name', 'price', 'createdAt', 'rating', 'sales')
      .default('createdAt')
      .messages({
        'any.only': 'Sort by must be one of: name, price, createdAt, rating, sales'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      }),
    minPrice: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Minimum price must be a number',
        'number.min': 'Minimum price cannot be negative'
      }),
    maxPrice: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Maximum price must be a number',
        'number.min': 'Maximum price cannot be negative'
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
    subCategoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Subcategory ID must be a number',
        'number.integer': 'Subcategory ID must be an integer',
        'number.positive': 'Subcategory ID must be positive'
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'draft')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, inactive, draft'
      })
  }),

  // Search products validation
  searchProducts: Joi.object({
    q: Joi.string()
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
      })
  }),

  // Get product by ID validation
  getProductById: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      })
  }),

  // Get products by category validation
  getProductsByCategory: Joi.object({
    categoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category ID is required'
      })
  }),

  // Get products by subcategory validation
  getProductsBySubCategory: Joi.object({
    subCategoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Subcategory ID must be a number',
        'number.integer': 'Subcategory ID must be an integer',
        'number.positive': 'Subcategory ID must be positive',
        'any.required': 'Subcategory ID is required'
      })
  }),

  // Create product validation
  createProduct: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name cannot exceed 200 characters',
        'any.required': 'Product name is required'
      }),
    description: Joi.string()
      .min(10)
      .max(2000)
      .required()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 2000 characters',
        'any.required': 'Description is required'
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be positive',
        'number.precision': 'Price can have maximum 2 decimal places',
        'any.required': 'Price is required'
      }),
    comparePrice: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Compare price must be a number',
        'number.positive': 'Compare price must be positive',
        'number.precision': 'Compare price can have maximum 2 decimal places'
      }),
    costPrice: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Cost price must be a number',
        'number.positive': 'Cost price must be positive',
        'number.precision': 'Cost price can have maximum 2 decimal places'
      }),
    sku: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[A-Z0-9\-_]+$/)
      .required()
      .messages({
        'string.min': 'SKU must be at least 3 characters long',
        'string.max': 'SKU cannot exceed 50 characters',
        'string.pattern.base': 'SKU can only contain uppercase letters, numbers, hyphens, and underscores',
        'any.required': 'SKU is required'
      }),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .pattern(/^[0-9]+$/)
      .optional()
      .messages({
        'string.min': 'Barcode must be at least 8 characters long',
        'string.max': 'Barcode cannot exceed 20 characters',
        'string.pattern.base': 'Barcode can only contain numbers'
      }),
    stockQuantity: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Stock quantity must be a number',
        'number.integer': 'Stock quantity must be an integer',
        'number.min': 'Stock quantity cannot be negative'
      }),
    lowStockThreshold: Joi.number()
      .integer()
      .min(0)
      .default(10)
      .messages({
        'number.base': 'Low stock threshold must be a number',
        'number.integer': 'Low stock threshold must be an integer',
        'number.min': 'Low stock threshold cannot be negative'
      }),
    weight: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Weight must be a number',
        'number.positive': 'Weight must be positive',
        'number.precision': 'Weight can have maximum 2 decimal places'
      }),
    dimensions: Joi.object({
      length: Joi.number().positive().precision(2).optional(),
      width: Joi.number().positive().precision(2).optional(),
      height: Joi.number().positive().precision(2).optional()
    }).optional(),
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
      .optional()
      .messages({
        'number.base': 'Subcategory ID must be a number',
        'number.integer': 'Subcategory ID must be an integer',
        'number.positive': 'Subcategory ID must be positive'
      }),
    images: Joi.array()
      .items(Joi.string().uri())
      .min(1)
      .max(10)
      .optional()
      .messages({
        'array.min': 'At least one image is required',
        'array.max': 'Cannot upload more than 10 images',
        'string.uri': 'Image must be a valid URL'
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
    status: Joi.string()
      .valid('active', 'inactive', 'draft')
      .default('draft')
      .messages({
        'any.only': 'Status must be one of: active, inactive, draft'
      }),
    isFeatured: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Is featured must be a boolean'
      }),
    isAvailable: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'Is available must be a boolean'
      })
  }),

  // Update product validation
  updateProduct: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      }),
    name: Joi.string()
      .min(2)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Product name must be at least 2 characters long',
        'string.max': 'Product name cannot exceed 200 characters'
      }),
    description: Joi.string()
      .min(10)
      .max(2000)
      .optional()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 2000 characters'
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be positive',
        'number.precision': 'Price can have maximum 2 decimal places'
      }),
    comparePrice: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Compare price must be a number',
        'number.positive': 'Compare price must be positive',
        'number.precision': 'Compare price can have maximum 2 decimal places'
      }),
    costPrice: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Cost price must be a number',
        'number.positive': 'Cost price must be positive',
        'number.precision': 'Cost price can have maximum 2 decimal places'
      }),
    sku: Joi.string()
      .min(3)
      .max(50)
      .pattern(/^[A-Z0-9\-_]+$/)
      .optional()
      .messages({
        'string.min': 'SKU must be at least 3 characters long',
        'string.max': 'SKU cannot exceed 50 characters',
        'string.pattern.base': 'SKU can only contain uppercase letters, numbers, hyphens, and underscores'
      }),
    barcode: Joi.string()
      .min(8)
      .max(20)
      .pattern(/^[0-9]+$/)
      .optional()
      .messages({
        'string.min': 'Barcode must be at least 8 characters long',
        'string.max': 'Barcode cannot exceed 20 characters',
        'string.pattern.base': 'Barcode can only contain numbers'
      }),
    stockQuantity: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Stock quantity must be a number',
        'number.integer': 'Stock quantity must be an integer',
        'number.min': 'Stock quantity cannot be negative'
      }),
    lowStockThreshold: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Low stock threshold must be a number',
        'number.integer': 'Low stock threshold must be an integer',
        'number.min': 'Low stock threshold cannot be negative'
      }),
    weight: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Weight must be a number',
        'number.positive': 'Weight must be positive',
        'number.precision': 'Weight can have maximum 2 decimal places'
      }),
    dimensions: Joi.object({
      length: Joi.number().positive().precision(2).optional(),
      width: Joi.number().positive().precision(2).optional(),
      height: Joi.number().positive().precision(2).optional()
    }).optional(),
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive'
      }),
    subCategoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Subcategory ID must be a number',
        'number.integer': 'Subcategory ID must be an integer',
        'number.positive': 'Subcategory ID must be positive'
      }),
    images: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot upload more than 10 images',
        'string.uri': 'Image must be a valid URL'
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
    status: Joi.string()
      .valid('active', 'inactive', 'draft')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, inactive, draft'
      }),
    isFeatured: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is featured must be a boolean'
      }),
    isAvailable: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is available must be a boolean'
      })
  }),

  // Delete product validation
  deleteProduct: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      })
  }),

  // Update product status validation
  updateProductStatus: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'draft')
      .required()
      .messages({
        'any.only': 'Status must be one of: active, inactive, draft',
        'any.required': 'Status is required'
      })
  }),

  // Update product stock validation
  updateProductStock: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required'
      }),
    stockQuantity: Joi.number()
      .integer()
      .min(0)
      .required()
      .messages({
        'number.base': 'Stock quantity must be a number',
        'number.integer': 'Stock quantity must be an integer',
        'number.min': 'Stock quantity cannot be negative',
        'any.required': 'Stock quantity is required'
      }),
    lowStockThreshold: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Low stock threshold must be a number',
        'number.integer': 'Low stock threshold must be an integer',
        'number.min': 'Low stock threshold cannot be negative'
      })
  }),

  // Get recommendations validation
  getRecommendations: Joi.object({
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
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive'
      })
  })
};

module.exports = { productValidators };
