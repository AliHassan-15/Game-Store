const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger/logger');

/**
 * Upload Middleware
 * Handles file uploads with validation and security checks
 */

// Configure storage
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(destination, { recursive: true });
        cb(null, destination);
      } catch (error) {
        logger.error('Error creating upload directory:', error);
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
};

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, .webp, .gif are allowed.'), false);
  }

  cb(null, true);
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX files are allowed.'), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension. Only .pdf, .doc, .docx, .xls, .xlsx are allowed.'), false);
  }

  cb(null, true);
};

// File size validator
const validateFileSize = (maxSize) => {
  return (req, file, cb) => {
    if (file.size > maxSize) {
      return cb(new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`), false);
    }
    cb(null, true);
  };
};

// Create multer instance for images
const createImageUpload = (options = {}) => {
  const {
    destination = path.join(__dirname, '../../../uploads/images'),
    maxSize = 5 * 1024 * 1024, // 5MB
    maxFiles = 10,
    fieldName = 'image'
  } = options;

  return multer({
    storage: createStorage(destination),
    fileFilter: imageFilter,
    limits: {
      fileSize: maxSize,
      files: maxFiles
    }
  });
};

// Create multer instance for documents
const createDocumentUpload = (options = {}) => {
  const {
    destination = path.join(__dirname, '../../../uploads/documents'),
    maxSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5,
    fieldName = 'document'
  } = options;

  return multer({
    storage: createStorage(destination),
    fileFilter: documentFilter,
    limits: {
      fileSize: maxSize,
      files: maxFiles
    }
  });
};

// Product image upload middleware
const productImageUpload = createImageUpload({
  destination: path.join(__dirname, '../../../uploads/products'),
  maxSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  fieldName: 'images'
});

// User avatar upload middleware
const avatarUpload = createImageUpload({
  destination: path.join(__dirname, '../../../uploads/avatars'),
  maxSize: 2 * 1024 * 1024, // 2MB
  maxFiles: 1,
  fieldName: 'avatar'
});

// Category image upload middleware
const categoryImageUpload = createImageUpload({
  destination: path.join(__dirname, '../../../uploads/categories'),
  maxSize: 2 * 1024 * 1024, // 2MB
  maxFiles: 1,
  fieldName: 'image'
});

// Document upload middleware
const documentUpload = createDocumentUpload({
  destination: path.join(__dirname, '../../../uploads/documents'),
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  fieldName: 'documents'
});

// Excel file upload middleware
const excelUpload = multer({
  storage: createStorage(path.join(__dirname, '../../../uploads/excel')),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const allowedExtensions = ['.xls', '.xlsx'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Invalid file extension. Only .xls, .xlsx are allowed.'), false);
    }

    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Error handler for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  logger.error('Upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'File upload failed'
  });
};

// File validation middleware
const validateUploadedFiles = (req, res, next) => {
  if (!req.files && !req.file) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const files = req.files || [req.file];
  
  // Validate each file
  for (const file of files) {
    if (!file) continue;

    // Check file size
    if (file.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'Empty file detected'
      });
    }

    // Check for malicious files (basic check)
    const maliciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (maliciousExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: 'Potentially malicious file type detected'
      });
    }
  }

  next();
};

// File cleanup middleware (remove uploaded files on error)
const cleanupUploadedFiles = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // If response indicates error, cleanup uploaded files
    if (res.statusCode >= 400) {
      const files = req.files || (req.file ? [req.file] : []);
      
      files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
          logger.info(`Cleaned up uploaded file: ${file.filename}`);
        } catch (error) {
          logger.error(`Error cleaning up file ${file.filename}:`, error);
        }
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Generate file URL middleware
const generateFileUrls = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  files.forEach(file => {
    file.url = `${req.protocol}://${req.get('host')}/uploads/${path.basename(file.destination)}/${file.filename}`;
  });

  next();
};

// File metadata middleware
const addFileMetadata = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  files.forEach(file => {
    file.metadata = {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id || 'anonymous'
    };
  });

  next();
};

module.exports = {
  createImageUpload,
  createDocumentUpload,
  productImageUpload,
  avatarUpload,
  categoryImageUpload,
  documentUpload,
  excelUpload,
  handleUploadError,
  validateUploadedFiles,
  cleanupUploadedFiles,
  generateFileUrls,
  addFileMetadata,
  imageFilter,
  documentFilter,
  validateFileSize
};
