const Joi = require('joi');

const categoryValidators = {
  getCategories: Joi.object({
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
      .valid('name', 'createdAt', 'productCount')
      .default('name')
      .messages({
        'any.only': 'Sort by must be one of: name, createdAt, productCount'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('asc')
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      }),
    includeSubCategories: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Include subcategories must be a boolean'
      })
  }),

  // Get category by ID validation
  getCategoryById: Joi.object({
    id: Joi.number()
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

  // Get subcategories validation
  getSubCategories: Joi.object({
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

  // Get category products validation
  getCategoryProducts: Joi.object({
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
      })
  }),

  // Create category validation
  createCategory: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 100 characters',
        'any.required': 'Category name is required'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    image: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Image must be a valid URL'
      }),
    isActive: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'Is active must be a boolean'
      }),
    sortOrder: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Sort order must be a number',
        'number.integer': 'Sort order must be an integer',
        'number.min': 'Sort order cannot be negative'
      })
  }),

  // Update category validation
  updateCategory: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.integer': 'Category ID must be an integer',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category ID is required'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 100 characters'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    image: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Image must be a valid URL'
      }),
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is active must be a boolean'
      }),
    sortOrder: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Sort order must be a number',
        'number.integer': 'Sort order must be an integer',
        'number.min': 'Sort order cannot be negative'
      })
  }),

  // Delete category validation
  deleteCategory: Joi.object({
    id: Joi.number()
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

  // Create subcategory validation
  createSubCategory: Joi.object({
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
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Subcategory name must be at least 2 characters long',
        'string.max': 'Subcategory name cannot exceed 100 characters',
        'any.required': 'Subcategory name is required'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    image: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Image must be a valid URL'
      }),
    isActive: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'Is active must be a boolean'
      }),
    sortOrder: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .messages({
        'number.base': 'Sort order must be a number',
        'number.integer': 'Sort order must be an integer',
        'number.min': 'Sort order cannot be negative'
      })
  }),

  // Update subcategory validation
  updateSubCategory: Joi.object({
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
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Subcategory name must be at least 2 characters long',
        'string.max': 'Subcategory name cannot exceed 100 characters'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    image: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Image must be a valid URL'
      }),
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is active must be a boolean'
      }),
    sortOrder: Joi.number()
      .integer()
      .min(0)
      .optional()
      .messages({
        'number.base': 'Sort order must be a number',
        'number.integer': 'Sort order must be an integer',
        'number.min': 'Sort order cannot be negative'
      })
  }),

  // Delete subcategory validation
  deleteSubCategory: Joi.object({
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
      })
  })
};

module.exports = { categoryValidators }; 