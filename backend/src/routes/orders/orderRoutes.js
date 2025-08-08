const express = require('express');
const router = express.Router();

// Import controller
const orderController = require('../../controllers/orders/orderController');

// Import middleware
const { authenticate, requireAdmin, requireBuyer } = require('../../middleware/auth/authMiddleware-simple');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');

// Import validation schemas
const { orderValidators } = require('../../validators/orderValidators');

// Buyer routes (buyer authentication required)
router.post('/create-from-cart',
  authenticate,
  requireBuyer,
  validateBody(orderValidators.createFromCart),
  orderController.createOrderFromCart
);

router.get('/my-orders',
  authenticate,
  requireBuyer,
  validateQuery(orderValidators.getMyOrders),
  orderController.getMyOrders
);

router.get('/my-orders/:orderId',
  authenticate,
  requireBuyer,
  validateParams(orderValidators.getMyOrderById),
  orderController.getMyOrderById
);

router.post('/my-orders/:orderId/cancel',
  authenticate,
  requireBuyer,
  validateParams(orderValidators.cancelOrder),
  orderController.cancelOrder
);

router.post('/my-orders/:orderId/request-refund',
  authenticate,
  requireBuyer,
  validateParams(orderValidators.requestRefund),
  validateBody(orderValidators.requestRefund),
  orderController.requestRefund
);

// Admin routes (admin authentication required)
router.get('/',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getAllOrders),
  orderController.getAllOrders
);

router.get('/:orderId',
  authenticate,
  requireAdmin,
  validateParams(orderValidators.getOrderById),
  orderController.getOrderById
);

router.put('/:orderId/status',
  authenticate,
  requireAdmin,
  validateParams(orderValidators.updateOrderStatus),
  validateBody(orderValidators.updateOrderStatus),
  orderController.updateOrderStatus
);

router.put('/:orderId/shipping',
  authenticate,
  requireAdmin,
  validateParams(orderValidators.updateShippingInfo),
  validateBody(orderValidators.updateShippingInfo),
  orderController.updateShippingInfo
);

router.post('/:orderId/refund',
  authenticate,
  requireAdmin,
  validateParams(orderValidators.processRefund),
  validateBody(orderValidators.processRefund),
  orderController.processRefund
);

// Order statistics (admin only)
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getOrderStats),
  orderController.getOrderStats
);

router.get('/stats/revenue',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getRevenueStats),
  orderController.getRevenueStats
);

router.get('/stats/status',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getStatusStats),
  orderController.getStatusStats
);

// Order management (admin only)
router.get('/pending',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getPendingOrders),
  orderController.getPendingOrders
);

router.get('/processing',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getProcessingOrders),
  orderController.getProcessingOrders
);

router.get('/shipped',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getShippedOrders),
  orderController.getShippedOrders
);

router.get('/delivered',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getDeliveredOrders),
  orderController.getDeliveredOrders
);

router.get('/cancelled',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getCancelledOrders),
  orderController.getCancelledOrders
);

router.get('/refunded',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.getRefundedOrders),
  orderController.getRefundedOrders
);

// Order export (admin only)
router.get('/export/excel',
  authenticate,
  requireAdmin,
  validateQuery(orderValidators.exportOrders),
  orderController.exportOrdersToExcel
);

// Order tracking (public route)
router.get('/track/:trackingNumber',
  validateParams(orderValidators.trackOrder),
  orderController.trackOrder
);

module.exports = router;
