const express = require('express');
const router = express.Router();

// Import controller
const adminController = require('../../controllers/admin/adminController-simple');

// Import middleware
const { authenticate, requireAdmin } = require('../../middleware/auth/authMiddleware-simple');

// Dashboard overview
router.get('/dashboard',
  authenticate,
  requireAdmin,
  adminController.getDashboard
);

// User management
router.get('/users',
  authenticate,
  requireAdmin,
  adminController.getUsers
);

router.get('/users/stats',
  authenticate,
  requireAdmin,
  adminController.getUserStats
);

// Product management
router.get('/products',
  authenticate,
  requireAdmin,
  adminController.getProducts
);

router.post('/products',
  authenticate,
  requireAdmin,
  adminController.createProduct
);

router.get('/products/:id',
  authenticate,
  requireAdmin,
  adminController.getProduct
);

router.put('/products/:id',
  authenticate,
  requireAdmin,
  adminController.updateProduct
);

router.delete('/products/:id',
  authenticate,
  requireAdmin,
  adminController.deleteProduct
);

router.get('/products/stats',
  authenticate,
  requireAdmin,
  adminController.getProductStats
);

// Order management
router.get('/orders',
  authenticate,
  requireAdmin,
  adminController.getOrders
);

router.get('/orders/stats',
  authenticate,
  requireAdmin,
  adminController.getOrderStats
);

// Category management
router.get('/categories',
  authenticate,
  requireAdmin,
  adminController.getCategories
);

router.get('/categories/stats',
  authenticate,
  requireAdmin,
  adminController.getCategoryStats
);

// Review management
router.get('/reviews',
  authenticate,
  requireAdmin,
  adminController.getReviews
);

router.get('/reviews/stats',
  authenticate,
  requireAdmin,
  adminController.getReviewStats
);

// Sales analytics
router.get('/analytics/sales',
  authenticate,
  requireAdmin,
  adminController.getSalesAnalytics
);

router.get('/analytics/revenue',
  authenticate,
  requireAdmin,
  adminController.getRevenueAnalytics
);

router.get('/analytics/products',
  authenticate,
  requireAdmin,
  adminController.getProductAnalytics
);

router.get('/analytics/users',
  authenticate,
  requireAdmin,
  adminController.getUserAnalytics
);

// Inventory management
router.get('/inventory',
  authenticate,
  requireAdmin,
  adminController.getInventory
);

router.get('/inventory/low-stock',
  authenticate,
  requireAdmin,
  adminController.getLowStock
);

router.get('/inventory/out-of-stock',
  authenticate,
  requireAdmin,
  adminController.getOutOfStock
);

router.get('/inventory/transactions',
  authenticate,
  requireAdmin,
  adminController.getInventoryTransactions
);

// System overview
router.get('/system/overview',
  authenticate,
  requireAdmin,
  adminController.getSystemOverview
);

router.get('/system/health',
  authenticate,
  requireAdmin,
  adminController.getSystemHealth
);

router.get('/system/logs',
  authenticate,
  requireAdmin,
  adminController.getSystemLogs
);

// Activity logs
router.get('/activity-logs',
  authenticate,
  requireAdmin,
  adminController.getActivityLogs
);

router.get('/activity-logs/user/:userId',
  authenticate,
  requireAdmin,
  adminController.getUserActivityLogs
);

// Reports
router.get('/reports/sales',
  authenticate,
  requireAdmin,
  adminController.getSalesReport
);

router.get('/reports/inventory',
  authenticate,
  requireAdmin,
  adminController.getInventoryReport
);

router.get('/reports/users',
  authenticate,
  requireAdmin,
  adminController.getUserReport
);

// Export functionality
router.get('/export/sales',
  authenticate,
  requireAdmin,
  adminController.exportSales
);

router.get('/export/inventory',
  authenticate,
  requireAdmin,
  adminController.exportInventory
);

router.get('/export/users',
  authenticate,
  requireAdmin,
  adminController.exportUsers
);

module.exports = router; 