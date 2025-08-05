const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth/authRoutes');
const productRoutes = require('./products/productRoutes');
const cartRoutes = require('./cart/cartRoutes');
const orderRoutes = require('./orders/orderRoutes');
const categoryRoutes = require('./categories/categoryRoutes');
const userRoutes = require('./users/userRoutes');
const reviewRoutes = require('./reviews/reviewRoutes');
const adminRoutes = require('./admin/adminRoutes');
const stripeRoutes = require('./stripe/stripeRoutes');
const uploadRoutes = require('./upload/uploadRoutes');

// Import utilities
const logger = require('../utils/logger/logger');
const { asyncHandler } = require('../middleware/errorHandler');

// API version prefix
const API_VERSION = '/api/v1';

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GameStore API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'GameStore API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      products: `${API_VERSION}/products`,
      cart: `${API_VERSION}/cart`,
      orders: `${API_VERSION}/orders`,
      categories: `${API_VERSION}/categories`,
      users: `${API_VERSION}/users`,
      reviews: `${API_VERSION}/reviews`,
      admin: `${API_VERSION}/admin`,
      stripe: `${API_VERSION}/stripe`,
      upload: `${API_VERSION}/upload`
    },
    features: {
      authentication: 'JWT + Session + Google OAuth',
      payment: 'Stripe Integration',
      fileUpload: 'Image and Document Upload',
      search: 'Product Search and Filtering',
      analytics: 'Admin Dashboard Analytics',
      inventory: 'Stock Management with Logs'
    },
    documentation: process.env.API_DOCS_URL || 'https://docs.gamestore.com'
  });
});

// Mount route modules
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/cart`, cartRoutes);
router.use(`${API_VERSION}/orders`, orderRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/reviews`, reviewRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/stripe`, stripeRoutes);
router.use(`${API_VERSION}/upload`, uploadRoutes);

// Stripe webhook endpoint (no body parsing for webhooks)
router.post(`${API_VERSION}/stripe/webhook`, express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const paymentService = require('../services/payment/paymentService');
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    await paymentService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}));

// Public routes (no authentication required)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GameStore API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
