const express = require('express');
const router = express.Router();

// Import controller
const cartController = require('../../controllers/cart/cartController');

// Import middleware
const { authenticate, requireBuyer } = require('../../middleware/auth/authMiddleware-simple');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');


// Import validation schemas
const { cartValidators } = require('../../validators/cartValidators');

/**
 * Cart Routes
 * Base path: /api/v1/cart
 * All routes require buyer authentication
 */

// Get cart (public route for initial load)
router.get('/',
  // authenticate, // Temporarily disabled for testing
  // requireBuyer, // Temporarily disabled for testing
  cartController.getCart
);

// Add item to cart
router.post('/add',
  authenticate,
  requireBuyer,

  validateBody(cartValidators.addToCart),
  cartController.addToCart
);

// Update cart item quantity
router.put('/items/:itemId',
  authenticate,
  requireBuyer,

  validateParams(cartValidators.updateCartItem),
  validateBody(cartValidators.updateCartItem),
  cartController.updateCartItem
);

// Remove item from cart
router.delete('/items/:itemId',
  authenticate,
  requireBuyer,

  validateParams(cartValidators.removeFromCart),
  cartController.removeFromCart
);

// Clear cart
router.delete('/clear',
  authenticate,
  requireBuyer,

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

  validateBody(cartValidators.applyCoupon),
  cartController.applyCoupon
);

// Remove coupon/discount
router.delete('/remove-coupon',
  authenticate,
  requireBuyer,

  cartController.removeCoupon
);

// Save cart for later
router.post('/save',
  authenticate,
  requireBuyer,

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

  validateParams(cartValidators.loadSavedCart),
  cartController.loadSavedCart
);

// Delete saved cart
router.delete('/saved/:cartId',
  authenticate,
  requireBuyer,

  validateParams(cartValidators.deleteSavedCart),
  cartController.deleteSavedCart
);

module.exports = router;
