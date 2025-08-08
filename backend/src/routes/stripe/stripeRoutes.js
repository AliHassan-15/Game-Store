const express = require('express');
const router = express.Router();

// Import controller
const stripeController = require('../../controllers/stripe/stripeController');

// Import middleware
const { authenticate, requireBuyer } = require('../../middleware/auth/authMiddleware-simple');
const { validateBody, validateParams } = require('../../middleware/validation/validationMiddleware');


// Import validation schemas
const { stripeValidators } = require('../../validators/stripeValidators');

// Payment intent routes
router.post('/create-payment-intent',
  authenticate,
  requireBuyer,

  validateBody(stripeValidators.createPaymentIntent),
  stripeController.createPaymentIntent
);

router.post('/confirm-payment',
  authenticate,
  requireBuyer,

  validateBody(stripeValidators.confirmPayment),
  stripeController.confirmPayment
);

router.get('/payment-intent/:intentId',
  authenticate,
  requireBuyer,
  validateParams(stripeValidators.getPaymentIntent),
  stripeController.getPaymentIntent
);

// Customer management
router.post('/create-customer',
  authenticate,
  requireBuyer,

  validateBody(stripeValidators.createCustomer),
  stripeController.createCustomer
);

// Payment method management
router.post('/create-payment-method',
  authenticate,
  requireBuyer,

  validateBody(stripeValidators.createPaymentMethod),
  stripeController.createPaymentMethod
);

router.post('/attach-payment-method',
  authenticate,
  requireBuyer,

  validateBody(stripeValidators.attachPaymentMethod),
  stripeController.attachPaymentMethod
);

// Refund routes
router.post('/create-refund',
  authenticate,
  requireBuyer,

  validateBody(stripeValidators.createRefund),
  stripeController.createRefund
);

// Webhook (no authentication required - Stripe signature verification)
router.post('/webhook',
  stripeController.handleWebhook
);

// Configuration
router.get('/config',
  stripeController.getStripeConfig
);

module.exports = router;
