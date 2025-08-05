const express = require('express');
const router = express.Router();

// Import controller
const categoryController = require('../../controllers/categories/categoryController');

// Import middleware
const { authenticate, requireAdmin, optionalAuth } = require('../../middleware/auth/authMiddleware');
const { validateBody, validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');
const { apiLimiter } = require('../../middleware/rateLimiter');

// Import validation schemas
const { categoryValidators } = require('../../validators/categoryValidators');

/**
 * Category Routes
 * Base path: /api/v1/categories
 */

// Public routes (no authentication required)
router.get('/',
  optionalAuth,
  validateQuery(categoryValidators.getCategories),
  categoryController.getCategories
);

router.get('/:id',
  optionalAuth,
  validateParams(categoryValidators.getCategoryById),
  categoryController.getCategoryById
);

router.get('/:id/subcategories',
  optionalAuth,
  validateParams(categoryValidators.getSubCategories),
  validateQuery(categoryValidators.getSubCategories),
  categoryController.getSubCategories
);

router.get('/:id/products',
  optionalAuth,
  validateParams(categoryValidators.getCategoryProducts),
  validateQuery(categoryValidators.getCategoryProducts),
  categoryController.getCategoryProducts
);

// Admin routes (admin authentication required)
router.post('/',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateBody(categoryValidators.createCategory),
  categoryController.createCategory
);

router.put('/:id',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(categoryValidators.updateCategory),
  validateBody(categoryValidators.updateCategory),
  categoryController.updateCategory
);

router.delete('/:id',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(categoryValidators.deleteCategory),
  categoryController.deleteCategory
);

// Subcategory routes
router.post('/:categoryId/subcategories',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(categoryValidators.createSubCategory),
  validateBody(categoryValidators.createSubCategory),
  categoryController.createSubCategory
);

router.put('/:categoryId/subcategories/:subCategoryId',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(categoryValidators.updateSubCategory),
  validateBody(categoryValidators.updateSubCategory),
  categoryController.updateSubCategory
);

router.delete('/:categoryId/subcategories/:subCategoryId',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(categoryValidators.deleteSubCategory),
  categoryController.deleteSubCategory
);

// Category statistics (admin only)
router.get('/stats/overview',
  authenticate,
  requireAdmin,
  categoryController.getCategoryStats
);

router.get('/stats/product-counts',
  authenticate,
  requireAdmin,
  categoryController.getCategoryProductCounts
);

// Category import/export (admin only)
router.post('/import/excel',
  authenticate,
  requireAdmin,
  apiLimiter,
  categoryController.importCategoriesFromExcel
);

router.get('/export/excel',
  authenticate,
  requireAdmin,
  categoryController.exportCategoriesToExcel
);

module.exports = router;
