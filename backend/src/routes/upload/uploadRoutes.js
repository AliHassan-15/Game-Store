const express = require('express');
const router = express.Router();

// Import controller
const uploadController = require('../../controllers/upload/uploadController');

// Import middleware
const { authenticate, requireAdmin } = require('../../middleware/auth/authMiddleware');
const { validateParams, validateQuery } = require('../../middleware/validation/validationMiddleware');
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
  productImageUpload.single('image'),
  uploadController.uploadProductImage
);

router.post('/product-images',
  authenticate,
  requireAdmin,
  productImageUpload.array('images', 10),
  uploadController.uploadProductImages
);

// User avatar upload
router.post('/avatar',
  authenticate,
  avatarUpload.single('avatar'),
  uploadController.uploadAvatar
);

// Category image upload (admin only)
router.post('/category-image',
  authenticate,
  requireAdmin,
  categoryImageUpload.single('image'),
  uploadController.uploadCategoryImage
);

// Document upload (admin only)
router.post('/document',
  authenticate,
  requireAdmin,
  documentUpload.single('document'),
  uploadController.uploadDocument
);

// File management
router.delete('/:filename',
  authenticate,
  requireAdmin,
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
  uploadController.cleanupFiles
);

// Upload statistics (admin only)
router.get('/stats',
  authenticate,
  requireAdmin,
  uploadController.getUploadStats
);

module.exports = router;
