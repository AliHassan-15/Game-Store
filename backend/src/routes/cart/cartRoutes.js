const express = require('express');
const router = express.Router();

// Import controller
const cartController = require('../../controllers/cart/cartController');

// Import middleware
const { authenticate, requireBuyer } = require('../../middleware/auth/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');
const { apiLimiter } = require('../../middleware/rateLimiter');

// Import validation schemas
const { cartValidators } = require('../../validators/cartValidators');

/**
 * Cart Routes
 * Base path: /api/v1/cart
 * All routes require buyer authentication
 */

// Get cart
router.get('/',
  authenticate,
  requireBuyer,
  cartController.getCart
);

// Add item to cart
router.post('/add',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateBody(cartValidators.addToCart),
  cartController.addToCart
);

// Update cart item quantity
router.put('/items/:itemId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(cartValidators.updateCartItem),
  validateBody(cartValidators.updateCartItem),
  cartController.updateCartItem
);

// Remove item from cart
router.delete('/items/:itemId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(cartValidators.removeFromCart),
  cartController.removeFromCart
);

// Clear cart
router.delete('/clear',
  authenticate,
  requireBuyer,
  apiLimiter,
  cartController.clearCart
);

// Get cart summary
router.get('/summary',
  authenticate,
  requireBuyer,
  cartController.getCartSummary
);

// Validate cart
router.get('/validate',
  authenticate,
  requireBuyer,
  cartController.validateCart
);

// Apply coupon/discount
router.post('/apply-coupon',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateBody(cartValidators.applyCoupon),
  cartController.applyCoupon
);

// Remove coupon/discount
router.delete('/remove-coupon',
  authenticate,
  requireBuyer,
  apiLimiter,
  cartController.removeCoupon
);

// Save cart for later
router.post('/save',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateBody(cartValidators.saveCart),
  cartController.saveCart
);

// Get saved carts
router.get('/saved',
  authenticate,
  requireBuyer,
  validateQuery(cartValidators.getSavedCarts),
  cartController.getSavedCarts
);

// Load saved cart
router.post('/load/:cartId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(cartValidators.loadSavedCart),
  cartController.loadSavedCart
);

// Delete saved cart
router.delete('/saved/:cartId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(cartValidators.deleteSavedCart),
  cartController.deleteSavedCart
);

module.exports = router;
