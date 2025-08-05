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

// API version prefix
const API_VERSION = '/api/v1';

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GameStore API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'GameStore API Documentation',
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
    version: '1.0.0'
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

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router;
