const express = require('express');
const router = express.Router();

// Import controller
const userController = require('../../controllers/users/userController');

// Import middleware
const { authenticate, requireAdmin, requireBuyer } = require('../../middleware/auth/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');
const { apiLimiter } = require('../../middleware/rateLimiter');

// Import validation schemas
const { userValidators } = require('../../validators/userValidators');

// Buyer routes (buyer authentication required)
router.get('/profile',
  authenticate,
  requireBuyer,
  userController.getUserProfile
);

router.put('/profile',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateBody(userValidators.updateProfile),
  userController.updateUserProfile
);

// User addresses
router.get('/addresses',
  authenticate,
  requireBuyer,
  userController.getUserAddresses
);

router.post('/addresses',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateBody(userValidators.createAddress),
  userController.createUserAddress
);

router.put('/addresses/:addressId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(userValidators.updateAddress),
  validateBody(userValidators.updateAddress),
  userController.updateUserAddress
);

router.delete('/addresses/:addressId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(userValidators.deleteAddress),
  userController.deleteUserAddress
);

router.put('/addresses/:addressId/set-default',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(userValidators.setDefaultAddress),
  userController.setDefaultAddress
);

// User payment methods
router.get('/payments',
  authenticate,
  requireBuyer,
  userController.getUserPayments
);

router.post('/payments',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateBody(userValidators.createPayment),
  userController.createUserPayment
);

router.put('/payments/:paymentId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(userValidators.updatePayment),
  validateBody(userValidators.updatePayment),
  userController.updateUserPayment
);

router.delete('/payments/:paymentId',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(userValidators.deletePayment),
  userController.deleteUserPayment
);

router.put('/payments/:paymentId/set-default',
  authenticate,
  requireBuyer,
  apiLimiter,
  validateParams(userValidators.setDefaultPayment),
  userController.setDefaultPayment
);

// User statistics
router.get('/stats',
  authenticate,
  requireBuyer,
  userController.getUserStats
);

router.get('/stats/orders',
  authenticate,
  requireBuyer,
  validateQuery(userValidators.getOrderStats),
  userController.getUserOrderStats
);

router.get('/stats/reviews',
  authenticate,
  requireBuyer,
  validateQuery(userValidators.getReviewStats),
  userController.getUserReviewStats
);

// Admin routes (admin authentication required)
router.get('/',
  authenticate,
  requireAdmin,
  validateQuery(userValidators.getAllUsers),
  userController.getAllUsers
);

router.get('/:userId',
  authenticate,
  requireAdmin,
  validateParams(userValidators.getUserById),
  userController.getUserById
);

router.put('/:userId',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(userValidators.updateUser),
  validateBody(userValidators.updateUser),
  userController.updateUser
);

router.delete('/:userId',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(userValidators.deleteUser),
  userController.deleteUser
);

router.put('/:userId/status',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(userValidators.updateUserStatus),
  validateBody(userValidators.updateUserStatus),
  userController.updateUserStatus
);

router.put('/:userId/role',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(userValidators.updateUserRole),
  validateBody(userValidators.updateUserRole),
  userController.updateUserRole
);

// User management (admin only)
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  userController.getUserManagementStats
);

router.get('/stats/registration',
  authenticate,
  requireAdmin,
  validateQuery(userValidators.getRegistrationStats),
  userController.getRegistrationStats
);

router.get('/stats/activity',
  authenticate,
  requireAdmin,
  validateQuery(userValidators.getActivityStats),
  userController.getActivityStats
);

// User export (admin only)
router.get('/export/excel',
  authenticate,
  requireAdmin,
  validateQuery(userValidators.exportUsers),
  userController.exportUsersToExcel
);

module.exports = router;
