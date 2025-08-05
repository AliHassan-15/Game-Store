const Joi = require('joi');

const cartValidators = {
  addToCart: Joi.object({
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
    quantity: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(1)
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 100'
      })
  }),

  // Update cart item validation
  updateCartItem: Joi.object({
    itemId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Cart item ID must be a number',
        'number.integer': 'Cart item ID must be an integer',
        'number.positive': 'Cart item ID must be positive',
        'any.required': 'Cart item ID is required'
      }),
    quantity: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .required()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity cannot exceed 100',
        'any.required': 'Quantity is required'
      })
  }),

  // Remove from cart validation
  removeFromCart: Joi.object({
    itemId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Cart item ID must be a number',
        'number.integer': 'Cart item ID must be an integer',
        'number.positive': 'Cart item ID must be positive',
        'any.required': 'Cart item ID is required'
      })
  }),

  // Apply coupon validation
  applyCoupon: Joi.object({
    couponCode: Joi.string()
      .min(3)
      .max(20)
      .pattern(/^[A-Z0-9]+$/)
      .required()
      .messages({
        'string.min': 'Coupon code must be at least 3 characters long',
        'string.max': 'Coupon code cannot exceed 20 characters',
        'string.pattern.base': 'Coupon code can only contain uppercase letters and numbers',
        'any.required': 'Coupon code is required'
      })
  }),

  // Save cart validation
  saveCart: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Cart name must be at least 2 characters long',
        'string.max': 'Cart name cannot exceed 100 characters',
        'any.required': 'Cart name is required'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      })
  }),

  // Get saved carts validation
  getSavedCarts: Joi.object({
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
      })
  }),

  // Load saved cart validation
  loadSavedCart: Joi.object({
    cartId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Cart ID must be a number',
        'number.integer': 'Cart ID must be an integer',
        'number.positive': 'Cart ID must be positive',
        'any.required': 'Cart ID is required'
      })
  }),

  // Delete saved cart validation
  deleteSavedCart: Joi.object({
    cartId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Cart ID must be a number',
        'number.integer': 'Cart ID must be an integer',
        'number.positive': 'Cart ID must be positive',
        'any.required': 'Cart ID is required'
      })
  })
};

module.exports = { cartValidators }; 