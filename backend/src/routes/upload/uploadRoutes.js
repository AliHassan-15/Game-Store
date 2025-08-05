const express = require('express');
const router = express.Router();

// Import controller
const uploadController = require('../../controllers/upload/uploadController');

// Import middleware
const { authenticate, requireAdmin } = require('../../middleware/auth/authMiddleware');
const { validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');
const { uploadLimiter, apiLimiter } = require('../../middleware/rateLimiter');
const { 
  productImageUpload, 
  avatarUpload, 
  categoryImageUpload, 
  documentUpload 
} = require('../../middleware/upload/uploadMiddleware');

// Import validation schemas
const { uploadValidators } = require('../../validators/uploadValidators');

// Product image upload (admin only)
router.post('/product-image',
  authenticate,
  requireAdmin,
  uploadLimiter,
  productImageUpload.single('image'),
  uploadController.uploadProductImage
);

router.post('/product-images',
  authenticate,
  requireAdmin,
  uploadLimiter,
  productImageUpload.array('images', 10),
  uploadController.uploadProductImages
);

// User avatar upload
router.post('/avatar',
  authenticate,
  uploadLimiter,
  avatarUpload.single('avatar'),
  uploadController.uploadAvatar
);

// Category image upload (admin only)
router.post('/category-image',
  authenticate,
  requireAdmin,
  uploadLimiter,
  categoryImageUpload.single('image'),
  uploadController.uploadCategoryImage
);

// Document upload (admin only)
router.post('/document',
  authenticate,
  requireAdmin,
  uploadLimiter,
  documentUpload.single('document'),
  uploadController.uploadDocument
);

// File management
router.delete('/:filename',
  authenticate,
  requireAdmin,
  apiLimiter,
  validateParams(uploadValidators.deleteFile),
  uploadController.deleteFile
);

router.get('/:filename/info',
  authenticate,
  requireAdmin,
  validateParams(uploadValidators.getFileInfo),
  uploadController.getFileInfo
);

router.get('/list',
  authenticate,
  requireAdmin,
  validateQuery(uploadValidators.listFiles),
  uploadController.listFiles
);

// File cleanup (admin only)
router.post('/cleanup',
  authenticate,
  requireAdmin,
  apiLimiter,
  uploadController.cleanupFiles
);

// Upload statistics (admin only)
router.get('/stats',
  authenticate,
  requireAdmin,
  uploadController.getUploadStats
);

module.exports = router;
