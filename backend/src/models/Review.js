const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Review = sequelize.define('Review', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique review identifier'
  },

  // User relationship
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'User who wrote the review'
  },

  // Product relationship
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Product being reviewed'
  },

  // Order relationship (to verify purchase)
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Order that contained this product'
  },

  // Rating
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Rating cannot exceed 5'
      }
    },
    comment: 'Product rating (1-5 stars)'
  },

  // Review content
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    validate: {
      len: {
        args: [0, 200],
        msg: 'Title cannot exceed 200 characters'
      }
    },
    comment: 'Review title'
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Review content is required'
      },
      len: {
        args: [10, 2000],
        msg: 'Review content must be between 10 and 2000 characters'
      }
    },
    comment: 'Review content'
  },

  // Review status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Review active status'
  },

  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Review approval status'
  },

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Verified purchase review'
  },

  // Helpfulness tracking
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Helpful count cannot be negative'
      }
    },
    comment: 'Number of users who found this review helpful'
  },

  notHelpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Not helpful count cannot be negative'
      }
    },
    comment: 'Number of users who found this review not helpful'
  },

  // Review metadata
  platform: {
    type: DataTypes.ENUM('PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Nintendo Switch', 'Mobile'),
    allowNull: true,
    comment: 'Platform the user played on'
  },

  playTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Play time cannot be negative'
      }
    },
    comment: 'Hours played (optional)'
  },

  // Admin moderation
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin notes for moderation'
  },

  moderatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Admin who moderated this review'
  },

  moderatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Review moderation timestamp'
  }

}, {
  // Table configuration
  tableName: 'reviews',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a review
    beforeCreate: async (review) => {
      // Check if user has purchased the product
      if (review.orderId) {
        const order = await sequelize.models.Order.findByPk(review.orderId);
        if (order && order.userId === review.userId) {
          review.isVerified = true;
        }
      }
    },

    // After creating a review
    afterCreate: async (review) => {
      // Update product average rating
      await review.updateProductRating();
    },

    // After updating a review
    afterUpdate: async (review) => {
      // Update product average rating if rating changed
      if (review.changed('rating')) {
        await review.updateProductRating();
      }
    },

    // After destroying a review
    afterDestroy: async (review) => {
      // Update product average rating
      await review.updateProductRating();
    }
  },

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id'],
      name: 'reviews_user_product_unique'
    },
    {
      fields: ['product_id'],
      name: 'reviews_product_id_index'
    },
    {
      fields: ['user_id'],
      name: 'reviews_user_id_index'
    },
    {
      fields: ['rating'],
      name: 'reviews_rating_index'
    },
    {
      fields: ['is_approved'],
      name: 'reviews_approved_index'
    },
    {
      fields: ['is_verified'],
      name: 'reviews_verified_index'
    },
    {
      fields: ['created_at'],
      name: 'reviews_created_at_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Get review with user details
Review.prototype.getWithUser = async function() {
  const user = await this.getUser({
    attributes: ['id', 'firstName', 'lastName', 'avatar']
  });
  
  return {
    ...this.toJSON(),
    user: user
  };
};

// Get review with product details
Review.prototype.getWithProduct = async function() {
  const product = await this.getProduct({
    attributes: ['id', 'name', 'slug', 'mainImage']
  });
  
  return {
    ...this.toJSON(),
    product: product
  };
};

// Get review with full details
Review.prototype.getWithFullDetails = async function() {
  const user = await this.getUser({
    attributes: ['id', 'firstName', 'lastName', 'avatar']
  });
  
  const product = await this.getProduct({
    attributes: ['id', 'name', 'slug', 'mainImage']
  });
  
  return {
    ...this.toJSON(),
    user: user,
    product: product
  };
};

// Check if review is helpful
Review.prototype.isHelpful = function() {
  return this.helpfulCount > this.notHelpfulCount;
};

// Get helpfulness percentage
Review.prototype.getHelpfulnessPercentage = function() {
  const total = this.helpfulCount + this.notHelpfulCount;
  if (total === 0) return 0;
  return Math.round((this.helpfulCount / total) * 100);
};

// Mark review as helpful
Review.prototype.markHelpful = async function() {
  this.helpfulCount += 1;
  await this.save();
  return this;
};

// Mark review as not helpful
Review.prototype.markNotHelpful = async function() {
  this.notHelpfulCount += 1;
  await this.save();
  return this;
};

// Approve review
Review.prototype.approve = async function(adminId) {
  this.isApproved = true;
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  await this.save();
  return this;
};

// Reject review
Review.prototype.reject = async function(adminId, notes = null) {
  this.isApproved = false;
  this.isActive = false;
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  if (notes) {
    this.adminNotes = notes;
  }
  await this.save();
  return this;
};

// Update product average rating
Review.prototype.updateProductRating = async function() {
  const product = await this.getProduct();
  if (!product) return;
  
  const reviews = await Review.findAll({
    where: {
      productId: this.productId,
      isActive: true,
      isApproved: true
    },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
    ]
  });
  
  const ratingData = reviews[0];
  const averageRating = parseFloat(ratingData.getDataValue('averageRating') || 0);
  const reviewCount = parseInt(ratingData.getDataValue('reviewCount') || 0);
  
  // Update product with new rating data
  await product.update({
    averageRating: averageRating,
    reviewCount: reviewCount
  });
};

/**
 * Class Methods
 */

// Find review by user and product
Review.findByUserAndProduct = async function(userId, productId) {
  return await this.findOne({
    where: { 
      userId: userId,
      productId: productId 
    }
  });
};

// Find reviews by product
Review.findByProduct = async function(productId, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      productId: productId,
      isActive: true,
      isApproved: true 
    },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'avatar']
    }],
    limit: limit,
    offset: offset,
    order: [['helpfulCount', 'DESC'], ['createdAt', 'DESC']]
  });
};

// Find reviews by user
Review.findByUser = async function(userId, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { userId: userId },
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      attributes: ['id', 'name', 'slug', 'mainImage']
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find reviews by rating
Review.findByRating = async function(productId, rating, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      productId: productId,
      rating: rating,
      isActive: true,
      isApproved: true 
    },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'avatar']
    }],
    limit: limit,
    offset: offset,
    order: [['helpfulCount', 'DESC'], ['createdAt', 'DESC']]
  });
};

// Find pending reviews (for moderation)
Review.findPendingReviews = async function(limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      isActive: true,
      isApproved: false 
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: sequelize.models.Product,
        as: 'product',
        attributes: ['id', 'name', 'slug']
      }
    ],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'ASC']]
  });
};

// Get review statistics for a product
Review.getProductStatistics = async function(productId) {
  const reviews = await this.findAll({
    where: {
      productId: productId,
      isActive: true,
      isApproved: true
    },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 5 THEN 1 END')), 'fiveStar'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 4 THEN 1 END')), 'fourStar'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 3 THEN 1 END')), 'threeStar'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 2 THEN 1 END')), 'twoStar'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 1 THEN 1 END')), 'oneStar']
    ]
  });
  
  const stats = reviews[0];
  const totalReviews = parseInt(stats.getDataValue('totalReviews') || 0);
  
  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0
      }
    };
  }
  
  const averageRating = parseFloat(stats.getDataValue('averageRating') || 0);
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: totalReviews,
    ratingDistribution: {
      fiveStar: parseInt(stats.getDataValue('fiveStar') || 0),
      fourStar: parseInt(stats.getDataValue('fourStar') || 0),
      threeStar: parseInt(stats.getDataValue('threeStar') || 0),
      twoStar: parseInt(stats.getDataValue('twoStar') || 0),
      oneStar: parseInt(stats.getDataValue('oneStar') || 0)
    }
  };
};

// Get overall review statistics
Review.getOverallStatistics = async function() {
  const totalReviews = await this.count({
    where: { isActive: true, isApproved: true }
  });
  
  const pendingReviews = await this.count({
    where: { isActive: true, isApproved: false }
  });
  
  const verifiedReviews = await this.count({
    where: { isActive: true, isApproved: true, isVerified: true }
  });
  
  const averageRating = await this.findOne({
    where: { isActive: true, isApproved: true },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
    ]
  });
  
  return {
    totalReviews,
    pendingReviews,
    verifiedReviews,
    averageRating: parseFloat(averageRating?.getDataValue('averageRating') || 0)
  };
};

module.exports = Review;
