const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    
    // Create upload directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating upload directory:', error);
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/gif': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  }
});

class UploadController {

  async uploadProductImage(req, res) {
    try {
      // Use multer middleware for single file upload
      upload.single('image')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 1 file allowed.'
              });
            }
          }
          
          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Generate file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        logger.info(`Product image uploaded: ${req.file.filename}, Size: ${req.file.size} bytes`);

        res.json({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
          }
        });
      });

    } catch (error) {
      logger.error('Upload product image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  async uploadProductImages(req, res) {
    try {
      // Use multer middleware for multiple file upload
      upload.array('images', 10)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'One or more files are too large. Maximum size is 5MB per file.'
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 10 files allowed.'
              });
            }
          }
          
          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
          });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
        }

        // Process uploaded files
        const uploadedFiles = req.files.map(file => {
          const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
          
          return {
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: fileUrl
          };
        });

        logger.info(`${uploadedFiles.length} product images uploaded`);

        res.json({
          success: true,
          message: `${uploadedFiles.length} images uploaded successfully`,
          data: {
            files: uploadedFiles,
            count: uploadedFiles.length
          }
        });
      });

    } catch (error) {
      logger.error('Upload product images error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Upload user avatar
   * POST /api/v1/upload/avatar
   */
  async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;

      // Use multer middleware for single file upload
      upload.single('avatar')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
              });
            }
          }
          
          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Generate file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Update user avatar in database
        const { User } = require('../../models');
        await User.update(
          { avatar: fileUrl },
          { where: { id: userId } }
        );

        logger.info(`User avatar uploaded: ${req.file.filename}, User: ${userId}`);

        res.json({
          success: true,
          message: 'Avatar uploaded successfully',
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
          }
        });
      });

    } catch (error) {
      logger.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete uploaded file
   * DELETE /api/v1/upload/files/:filename
   */
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      const uploadDir = path.join(__dirname, '../../../uploads');
      const filePath = path.join(uploadDir, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Delete file
      await fs.unlink(filePath);

      logger.info(`File deleted: ${filename}`);

      res.json({
        success: true,
        message: 'File deleted successfully',
        data: {
          filename: filename
        }
      });

    } catch (error) {
      logger.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get file information
   * GET /api/v1/upload/files/:filename
   */
  async getFileInfo(req, res) {
    try {
      const { filename } = req.params;
      const uploadDir = path.join(__dirname, '../../../uploads');
      const filePath = path.join(uploadDir, filename);

      // Check if file exists
      try {
        const stats = await fs.stat(filePath);
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

        res.json({
          success: true,
          data: {
            filename: filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            url: fileUrl
          }
        });

      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

    } catch (error) {
      logger.error('Get file info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file information',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * List uploaded files
   * GET /api/v1/upload/files
   */
  async listFiles(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const uploadDir = path.join(__dirname, '../../../uploads');

      // Check if upload directory exists
      try {
        await fs.access(uploadDir);
      } catch (error) {
        return res.json({
          success: true,
          data: {
            files: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: parseInt(limit)
            }
          }
        });
      }

      // Read directory
      const files = await fs.readdir(uploadDir);
      const fileStats = await Promise.all(
        files.map(async (filename) => {
          try {
            const filePath = path.join(uploadDir, filename);
            const stats = await fs.stat(filePath);
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
            
            return {
              filename,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              url: fileUrl
            };
          } catch (error) {
            return null;
          }
        })
      );

      // Filter out null values and sort by creation date
      const validFiles = fileStats.filter(file => file !== null)
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      // Pagination
      const offset = (page - 1) * limit;
      const paginatedFiles = validFiles.slice(offset, offset + parseInt(limit));
      const totalPages = Math.ceil(validFiles.length / limit);

      res.json({
        success: true,
        data: {
          files: paginatedFiles,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: validFiles.length,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('List files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list files',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Clean up orphaned files
   * POST /api/v1/upload/cleanup
   */
  async cleanupFiles(req, res) {
    try {
      const uploadDir = path.join(__dirname, '../../../uploads');

      // Check if upload directory exists
      try {
        await fs.access(uploadDir);
      } catch (error) {
        return res.json({
          success: true,
          message: 'No upload directory found',
          data: {
            deletedFiles: 0,
            totalSize: 0
          }
        });
      }

      // Read directory
      const files = await fs.readdir(uploadDir);
      let deletedFiles = 0;
      let totalSize = 0;

      // Check each file against database references
      const { Product, User } = require('../../models');

      for (const filename of files) {
        try {
          const filePath = path.join(uploadDir, filename);
          const stats = await fs.stat(filePath);
          const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

          // Check if file is referenced in products
          const productWithImage = await Product.findOne({
            where: {
              [require('sequelize').Op.or]: [
                { mainImage: fileUrl },
                { images: { [require('sequelize').Op.contains]: [fileUrl] } }
              ]
            }
          });

          // Check if file is referenced in users
          const userWithAvatar = await User.findOne({
            where: { avatar: fileUrl }
          });

          // If file is not referenced, delete it
          if (!productWithImage && !userWithAvatar) {
            await fs.unlink(filePath);
            deletedFiles++;
            totalSize += stats.size;
            logger.info(`Orphaned file deleted: ${filename}`);
          }

        } catch (error) {
          logger.error(`Error processing file ${filename}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Cleanup completed. ${deletedFiles} files deleted.`,
        data: {
          deletedFiles,
          totalSize: totalSize,
          freedSpace: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
        }
      });

    } catch (error) {
      logger.error('Cleanup files error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup files',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get upload statistics
   * GET /api/v1/upload/stats
   */
  async getUploadStats(req, res) {
    try {
      const uploadDir = path.join(__dirname, '../../../uploads');

      // Check if upload directory exists
      try {
        await fs.access(uploadDir);
      } catch (error) {
        return res.json({
          success: true,
          data: {
            totalFiles: 0,
            totalSize: 0,
            averageFileSize: 0,
            fileTypes: {}
          }
        });
      }

      // Read directory
      const files = await fs.readdir(uploadDir);
      const fileStats = await Promise.all(
        files.map(async (filename) => {
          try {
            const filePath = path.join(uploadDir, filename);
            const stats = await fs.stat(filePath);
            const ext = path.extname(filename).toLowerCase();
            
            return {
              size: stats.size,
              extension: ext
            };
          } catch (error) {
            return null;
          }
        })
      );

      // Calculate statistics
      const validFiles = fileStats.filter(file => file !== null);
      const totalFiles = validFiles.length;
      const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

      // Count file types
      const fileTypes = {};
      validFiles.forEach(file => {
        const ext = file.extension || 'unknown';
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totalFiles,
          totalSize: totalSize,
          averageFileSize: Math.round(averageFileSize),
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          averageFileSizeKB: (averageFileSize / 1024).toFixed(2),
          fileTypes
        }
      });

    } catch (error) {
      logger.error('Get upload stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upload statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Upload category image
   * POST /api/v1/upload/category-image
   */
  async uploadCategoryImage(req, res) {
    try {
      // Use multer middleware for single file upload
      upload.single('image')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 1 file allowed.'
              });
            }
          }
          
          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Generate file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        logger.info(`Category image uploaded: ${req.file.filename}, Size: ${req.file.size} bytes`);

        res.json({
          success: true,
          message: 'Category image uploaded successfully',
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
          }
        });
      });

    } catch (error) {
      logger.error('Upload category image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload category image',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Upload document
   * POST /api/v1/upload/document
   */
  async uploadDocument(req, res) {
    try {
      // Use multer middleware for single file upload
      upload.single('document')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB.'
              });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
              return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum 1 file allowed.'
              });
            }
          }
          
          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        // Generate file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        logger.info(`Document uploaded: ${req.file.filename}, Size: ${req.file.size} bytes`);

        res.json({
          success: true,
          message: 'Document uploaded successfully',
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: fileUrl
          }
        });
      });

    } catch (error) {
      logger.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new UploadController();
