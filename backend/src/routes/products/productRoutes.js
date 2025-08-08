const express = require('express');
const router = express.Router();

// Import controller
const productController = require('../../controllers/products/productController');

// Import middleware
const { authenticate, requireAdmin, requireBuyer, optionalAuth } = require('../../middleware/auth/authMiddleware-simple');
const { validateBody, validateQuery, validateParams } = require('../../middleware/validation/validationMiddleware');


// Import validation schemas
const { productValidators } = require('../../validators/productValidators');

// Public routes (no authentication required)
router.get('/',
  optionalAuth,
  // validateQuery(productValidators.getProducts), // Temporarily disabled for testing
  productController.getAllProducts
);

router.get('/featured',
  optionalAuth,
  productController.getFeaturedProducts
);

router.get('/on-sale',
  optionalAuth,
  productController.getOnSaleProducts
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
  productController.getAllProducts
);

router.get('/subcategory/:subCategoryId',
  optionalAuth,
  validateParams(productValidators.getProductsBySubCategory),
  validateQuery(productValidators.getProducts),
  productController.getAllProducts
);

// Admin routes (admin authentication required)
router.post('/',
  authenticate,
  requireAdmin,

  validateBody(productValidators.createProduct),
  productController.createProduct
);

router.put('/:id',
  authenticate,
  requireAdmin,

  validateParams(productValidators.updateProduct),
  validateBody(productValidators.updateProduct),
  productController.updateProduct
);

router.delete('/:id',
  authenticate,
  requireAdmin,

  validateParams(productValidators.deleteProduct),
  productController.deleteProduct
);

router.post('/bulk-import',
  authenticate,
  requireAdmin,
  productController.createProduct
);

router.get('/export/excel',
  authenticate,
  requireAdmin,
  productController.getAllProducts
);

// Product statistics (admin only)
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  productController.getProductStatistics
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
  validateParams(productValidators.updateProductStatus),
  validateBody(productValidators.updateProductStatus),
  productController.updateProduct
);

router.put('/:id/stock',
  authenticate,
  requireAdmin,
  validateParams(productValidators.updateProductStock),
  validateBody(productValidators.updateProductStock),
  productController.updateProduct
);

// Buyer routes (buyer authentication required)
router.get('/recommendations',
  authenticate,
  requireBuyer,
  validateQuery(productValidators.getRecommendations),
  productController.getFeaturedProducts
);

router.get('/recently-viewed',
  authenticate,
  requireBuyer,
  productController.getFeaturedProducts
);

module.exports = router;
