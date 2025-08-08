const express = require('express');
const router = express.Router();

// Import controller
const adminController = require('../../controllers/admin/adminController');

// Import middleware
const { authenticate, requireAdmin } = require('../../middleware/auth/authMiddleware-simple');
const { validateQuery } = require('../../middleware/validation/validationMiddleware');

// Import validation schemas
const { adminValidators } = require('../../validators/adminValidators');

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
  validateQuery(adminValidators.getReviews),
  adminController.getReviews
);

router.get('/reviews/stats',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getReviewStats),
  adminController.getReviewStats
);

// Sales analytics
router.get('/analytics/sales',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getSalesAnalytics),
  adminController.getSalesAnalytics
);

router.get('/analytics/revenue',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getRevenueAnalytics),
  adminController.getRevenueAnalytics
);

router.get('/analytics/products',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getProductAnalytics),
  adminController.getProductAnalytics
);

router.get('/analytics/users',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getUserAnalytics),
  adminController.getUserAnalytics
);

// Inventory management
router.get('/inventory',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getInventory),
  adminController.getInventory
);

router.get('/inventory/low-stock',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getLowStock),
  adminController.getLowStock
);

router.get('/inventory/out-of-stock',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getOutOfStock),
  adminController.getOutOfStock
);

router.get('/inventory/transactions',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getInventoryTransactions),
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
  validateQuery(adminValidators.getSystemLogs),
  adminController.getSystemLogs
);

// Activity logs
router.get('/activity-logs',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getActivityLogs),
  adminController.getActivityLogs
);

router.get('/activity-logs/user/:userId',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getUserActivityLogs),
  adminController.getUserActivityLogs
);

// Reports
router.get('/reports/sales',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getSalesReport),
  adminController.getSalesReport
);

router.get('/reports/inventory',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getInventoryReport),
  adminController.getInventoryReport
);

router.get('/reports/users',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.getUserReport),
  adminController.getUserReport
);

// Export functionality
router.get('/export/sales',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.exportSales),
  adminController.exportSales
);

router.get('/export/inventory',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.exportInventory),
  adminController.exportInventory
);

router.get('/export/users',
  authenticate,
  requireAdmin,
  validateQuery(adminValidators.exportUsers),
  adminController.exportUsers
);

module.exports = router;
