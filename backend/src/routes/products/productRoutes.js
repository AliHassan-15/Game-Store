const express = require('express');
const router = express.Router();

// Import controller
const productController = require('../../controllers/products/productController');

// Import middleware
const { authenticate, requireAdmin, requireBuyer, optionalAuth } = require('../../middleware/auth/authMiddleware');
const { validateBody, validateQuery, validateParams } = require('../../middleware/validation/validationMiddleware');
const { apiLimiter } = require('../../middleware/rateLimiter');

// Import validation schemas
const { productValidators } = require('../../validators/productValidators');

// Public routes (no authentication required)
router.get('/',
  optionalAuth,
  validateQuery(productValidators.getProducts),
  productController.getProducts
);

router.get('/search',
  optionalAuth,
  validateQuery(productValidators.searchProducts),
  productController.searchProducts
);

router.get('/:id',
  optionalAuth,
  validateParams(productValidators.getProductById),
  productController.getProductById
);

router.get('/category/:categoryId',
  optionalAuth,
  validateParams(productValidators.getProductsByCategory),
  validateQuery(productValidators.getProducts),
  productController.getProductsByCategory
);

router.get('/subcategory/:subCategoryId',
  optionalAuth,
  validateParams(productValidators.getProductsBySubCategory),
  validateQuery(productValidators.getProducts),
  productController.getProductsBySubCategory
);

// Admin routes (admin authentication required)
router.post('/',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateBody(productValidators.createProduct),
  productController.createProduct
);

router.put('/:id',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(productValidators.updateProduct),
  validateBody(productValidators.updateProduct),
  productController.updateProduct
);

router.delete('/:id',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(productValidators.deleteProduct),
  productController.deleteProduct
);

router.post('/bulk-import',
  authenticate,
  requireAdmin,
  apiLimiter,
  productController.bulkImportProducts
);

router.get('/export/excel',
  authenticate,
  requireAdmin,
  productController.exportProductsToExcel
);

// Product statistics (admin only)
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  productController.getProductStats
);

router.get('/stats/low-stock',
  authenticate,
  requireAdmin,
  productController.getLowStockProducts
);

router.get('/stats/out-of-stock',
  authenticate,
  requireAdmin,
  productController.getOutOfStockProducts
);

// Product management (admin only)
router.put('/:id/status',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(productValidators.updateProductStatus),
  validateBody(productValidators.updateProductStatus),
  productController.updateProductStatus
);

router.put('/:id/stock',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(productValidators.updateProductStock),
  validateBody(productValidators.updateProductStock),
  productController.updateProductStock
);

// Buyer routes (buyer authentication required)
router.get('/recommendations',
  authenticate,
  requireBuyer,
  validateQuery(productValidators.getRecommendations),
  productController.getProductRecommendations
);

router.get('/recently-viewed',
  authenticate,
  requireBuyer,
  productController.getRecentlyViewedProducts
);

module.exports = router;
