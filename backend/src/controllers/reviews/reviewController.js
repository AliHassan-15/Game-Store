const { Review, Product, User, Order, OrderItem } = require('../../models');
const logger = require('../../utils/logger/logger');

class ReviewController {

  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10, rating, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { productId, isActive: true };

      if (rating) {
        whereClause.rating = parseInt(rating);
      }

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate average rating
      const ratingStats = await Review.findAll({
        where: { productId, isActive: true },
        attributes: [
          [require('sequelize').fn('AVG', require('sequelize').col('rating')), 'averageRating'],
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalReviews'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 5 THEN 1 END')), 'fiveStar'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 4 THEN 1 END')), 'fourStar'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 3 THEN 1 END')), 'threeStar'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 2 THEN 1 END')), 'twoStar'],
          [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN rating = 1 THEN 1 END')), 'oneStar']
        ]
      });

      const stats = ratingStats[0];
      const averageRating = parseFloat(stats.getDataValue('averageRating') || 0);
      const totalReviews = parseInt(stats.getDataValue('totalReviews') || 0);

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          reviews: reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: review.isVerified,
            createdAt: review.createdAt,
            user: {
              id: review.user.id,
              name: `${review.user.firstName} ${review.user.lastName}`,
              avatar: review.user.avatar
            }
          })),
          statistics: {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews,
            ratingDistribution: {
              fiveStar: parseInt(stats.getDataValue('fiveStar') || 0),
              fourStar: parseInt(stats.getDataValue('fourStar') || 0),
              threeStar: parseInt(stats.getDataValue('threeStar') || 0),
              twoStar: parseInt(stats.getDataValue('twoStar') || 0),
              oneStar: parseInt(stats.getDataValue('oneStar') || 0)
            }
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get product reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product reviews',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create product review
   * POST /api/v1/products/:productId/reviews
   */
  async createReview(req, res) {
    try {
      const { productId } = req.params;
      const { rating, title, comment } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      if (!title || title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Review title must be at least 3 characters long'
        });
      }

      if (!comment || comment.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Review comment must be at least 10 characters long'
        });
      }

      // Check if product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({
        where: { productId, userId, isActive: true }
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // Verify user has purchased the product
      const hasPurchased = await OrderItem.findOne({
        include: [
          {
            model: Order,
            as: 'order',
            where: { userId, status: 'delivered' }
          },
          {
            model: Product,
            as: 'product',
            where: { id: productId }
          }
        ]
      });

      if (!hasPurchased) {
        return res.status(403).json({
          success: false,
          message: 'You can only review products you have purchased and received'
        });
      }

      // Create review
      const review = await Review.create({
        productId,
        userId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        isVerified: true // Verified since user has purchased
      });

      // Log activity
      await require('../../models').ActivityLog.createUserActivity(
        userId,
        'review_create',
        'Product review created',
        { 
          productId,
          productName: product.name,
          rating,
          title: review.title
        }
      );

      logger.info(`Review created: Product ${productId}, User ${userId}, Rating ${rating}`);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: {
          review: {
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: review.isVerified,
            createdAt: review.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update user's review
   * PUT /api/v1/reviews/:reviewId
   */
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { rating, title, comment } = req.body;
      const userId = req.user.id;

      // Find review
      const review = await Review.findOne({
        where: { id: reviewId, userId, isActive: true },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Validate input
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      if (title && title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Review title must be at least 3 characters long'
        });
      }

      if (comment && comment.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Review comment must be at least 10 characters long'
        });
      }

      // Update review
      await review.update({
        rating: rating || review.rating,
        title: title ? title.trim() : review.title,
        comment: comment ? comment.trim() : review.comment
      });

      // Log activity
      await require('../../models').ActivityLog.createUserActivity(
        userId,
        'review_update',
        'Product review updated',
        { 
          reviewId,
          productId: review.productId,
          productName: review.product.name,
          rating: review.rating
        }
      );

      logger.info(`Review updated: ${reviewId}, User ${userId}`);

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: {
          review: {
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: review.isVerified,
            updatedAt: review.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete user's review
   * DELETE /api/v1/reviews/:reviewId
   */
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.id;

      const review = await Review.findOne({
        where: { id: reviewId, userId, isActive: true },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Soft delete review
      await review.update({ isActive: false });

      // Log activity
      await require('../../models').ActivityLog.createUserActivity(
        userId,
        'review_delete',
        'Product review deleted',
        { 
          reviewId,
          productId: review.productId,
          productName: review.product.name
        }
      );

      logger.info(`Review deleted: ${reviewId}, User ${userId}`);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });

    } catch (error) {
      logger.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user's reviews
   * GET /api/v1/users/reviews
   */
  async getUserReviews(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: { userId, isActive: true },
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          reviews: reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: review.isVerified,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            product: {
              id: review.product.id,
              name: review.product.name,
              slug: review.product.slug,
              mainImage: review.product.mainImage
            }
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get user reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user reviews',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get review by ID
   * GET /api/v1/reviews/:reviewId
   */
  async getReviewById(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findOne({
        where: { id: reviewId, isActive: true },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage']
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      res.json({
        success: true,
        data: {
          review: {
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: review.isVerified,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            user: {
              id: review.user.id,
              name: `${review.user.firstName} ${review.user.lastName}`,
              avatar: review.user.avatar
            },
            product: {
              id: review.product.id,
              name: review.product.name,
              slug: review.product.slug,
              mainImage: review.product.mainImage
            }
          }
        }
      });

    } catch (error) {
      logger.error('Get review by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get review',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Admin: Get all reviews
   * GET /api/v1/admin/reviews
   */
  async getAllReviews(req, res) {
    try {
      const { page = 1, limit = 20, productId, userId, rating, isVerified } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { isActive: true };

      if (productId) whereClause.productId = productId;
      if (userId) whereClause.userId = userId;
      if (rating) whereClause.rating = parseInt(rating);
      if (isVerified !== undefined) whereClause.isVerified = isVerified === 'true';

      const { count, rows: reviews } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          reviews: reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: review.isVerified,
            createdAt: review.createdAt,
            user: {
              id: review.user.id,
              name: `${review.user.firstName} ${review.user.lastName}`,
              email: review.user.email
            },
            product: {
              id: review.product.id,
              name: review.product.name,
              slug: review.product.slug
            }
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get all reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reviews',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Admin: Update review status
   * PUT /api/v1/admin/reviews/:reviewId/status
   */
  async updateReviewStatus(req, res) {
    try {
      const { reviewId } = req.params;
      const { isActive } = req.body;
      const adminId = req.user.id;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.update({ isActive });

      // Log activity
      await require('../../models').ActivityLog.createUserActivity(
        adminId,
        'admin_review_status_update',
        `Review status updated to ${isActive ? 'active' : 'inactive'}`,
        { 
          reviewId,
          productId: review.productId,
          userId: review.userId,
          newStatus: isActive
        }
      );

      logger.info(`Review status updated by admin: ${reviewId} -> ${isActive ? 'active' : 'inactive'}`);

      res.json({
        success: true,
        message: 'Review status updated successfully',
        data: {
          review: {
            id: review.id,
            isActive: review.isActive
          }
        }
      });

    } catch (error) {
      logger.error('Update review status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new ReviewController();
