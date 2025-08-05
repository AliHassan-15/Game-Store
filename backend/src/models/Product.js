const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique product identifier'
  },

  // Product information
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Product name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Product name must be between 2 and 255 characters'
      }
    },
    comment: 'Product name'
  },

  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Product slug is required'
      },
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    },
    comment: 'URL-friendly product identifier'
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Product description'
  },

  shortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Short product description for listings'
  },

  // Pricing
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Price must be 0 or greater'
      }
    },
    comment: 'Product price'
  },

  comparePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Compare price must be 0 or greater'
      }
    },
    comment: 'Original price for discount display'
  },

  // Inventory
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'SKU is required'
      }
    },
    comment: 'Stock Keeping Unit (unique product code)'
  },

  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Stock quantity cannot be negative'
      }
    },
    comment: 'Available stock quantity'
  },

  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Low stock threshold cannot be negative'
      }
    },
    comment: 'Threshold for low stock alerts'
  },

  // Product status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Product active status'
  },

  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Featured product status'
  },

  isOnSale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Product on sale status'
  },

  // Category relationships
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    comment: 'Main category ID'
  },

  subCategoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sub_categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Subcategory ID'
  },

  // Images
  mainImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Main image must be a valid URL'
      }
    },
    comment: 'Main product image URL'
  },

  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of additional product image URLs'
  },

  // Product specifications
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Product specifications (platform, genre, etc.)'
  },

  // Game-specific fields
  platform: {
    type: DataTypes.ENUM('PC', 'PS4', 'PS5', 'Xbox One', 'Xbox Series X', 'Nintendo Switch', 'Mobile', 'Multi-platform'),
    allowNull: true,
    comment: 'Gaming platform'
  },

  genre: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Game genre'
  },

  releaseDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Game release date'
  },

  publisher: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Game publisher'
  },

  developer: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Game developer'
  },

  // SEO fields
  metaTitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'SEO meta title'
  },

  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO meta description'
  },

  metaKeywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO meta keywords'
  },

  // Sales tracking
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Product view count'
  },

  soldCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Total units sold'
  }

}, {
  // Table configuration
  tableName: 'products',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a product
    beforeCreate: async (product) => {
      // Generate slug if not provided
      if (!product.slug) {
        product.slug = product.generateSlug();
      }
      
      // Normalize name
      product.name = product.name.trim();
      
      // Set isOnSale based on compare price
      if (product.comparePrice && product.comparePrice > product.price) {
        product.isOnSale = true;
      }
    },

    // Before updating a product
    beforeUpdate: async (product) => {
      // Generate slug if name changed and slug not provided
      if (product.changed('name') && !product.changed('slug')) {
        product.slug = product.generateSlug();
      }
      
      // Normalize name if changed
      if (product.changed('name')) {
        product.name = product.name.trim();
      }
      
      // Update isOnSale based on compare price
      if (product.changed('comparePrice') || product.changed('price')) {
        product.isOnSale = product.comparePrice && product.comparePrice > product.price;
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['slug'],
      name: 'products_slug_unique'
    },
    {
      unique: true,
      fields: ['sku'],
      name: 'products_sku_unique'
    },
    {
      fields: ['category_id'],
      name: 'products_category_id_index'
    },
    {
      fields: ['sub_category_id'],
      name: 'products_sub_category_id_index'
    },
    {
      fields: ['is_active'],
      name: 'products_active_index'
    },
    {
      fields: ['is_featured'],
      name: 'products_featured_index'
    },
    {
      fields: ['is_on_sale'],
      name: 'products_on_sale_index'
    },
    {
      fields: ['price'],
      name: 'products_price_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Generate URL-friendly slug from name
Product.prototype.generateSlug = function() {
  return this.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Get product with category and subcategory
Product.prototype.getWithCategories = async function() {
  const category = await this.getCategory();
  const subcategory = await this.getSubCategory();
  
  return {
    ...this.toJSON(),
    category: category,
    subcategory: subcategory
  };
};

// Get product with reviews
Product.prototype.getWithReviews = async function() {
  const reviews = await this.getReviews({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'avatar']
    }]
  });
  
  return {
    ...this.toJSON(),
    reviews: reviews
  };
};

// Get product with average rating
Product.prototype.getWithRating = async function() {
  const reviews = await this.getReviews({
    where: { isActive: true },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
    ]
  });
  
  const ratingData = reviews[0];
  const averageRating = parseFloat(ratingData.getDataValue('averageRating') || 0);
  const reviewCount = parseInt(ratingData.getDataValue('reviewCount') || 0);
  
  return {
    ...this.toJSON(),
    averageRating: averageRating,
    reviewCount: reviewCount
  };
};

// Check if product is in stock
Product.prototype.isInStock = function() {
  return this.stockQuantity > 0;
};

// Check if product is low in stock
Product.prototype.isLowStock = function() {
  return this.stockQuantity <= this.lowStockThreshold && this.stockQuantity > 0;
};

// Check if product is out of stock
Product.prototype.isOutOfStock = function() {
  return this.stockQuantity <= 0;
};

// Get discount percentage
Product.prototype.getDiscountPercentage = function() {
  if (!this.comparePrice || this.comparePrice <= this.price) {
    return 0;
  }
  return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
};

// Increment view count
Product.prototype.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
  return this.viewCount;
};

// Decrease stock quantity
Product.prototype.decreaseStock = async function(quantity = 1) {
  if (this.stockQuantity >= quantity) {
    this.stockQuantity -= quantity;
    this.soldCount += quantity;
    await this.save();
    return true;
  }
  return false;
};

// Increase stock quantity
Product.prototype.increaseStock = async function(quantity = 1) {
  this.stockQuantity += quantity;
  await this.save();
  return this.stockQuantity;
};

/**
 * Class Methods
 */

// Find product by slug
Product.findBySlug = async function(slug) {
  return await this.findOne({
    where: { 
      slug: slug,
      isActive: true 
    }
  });
};

// Find product by SKU
Product.findBySku = async function(sku) {
  return await this.findOne({
    where: { sku: sku }
  });
};

// Find active products
Product.findActiveProducts = async function() {
  return await this.findAll({
    where: { isActive: true },
    order: [['createdAt', 'DESC']]
  });
};

// Find featured products
Product.findFeaturedProducts = async function(limit = 10) {
  return await this.findAll({
    where: { 
      isActive: true,
      isFeatured: true 
    },
    limit: limit,
    order: [['createdAt', 'DESC']]
  });
};

// Find products on sale
Product.findOnSaleProducts = async function(limit = 20) {
  return await this.findAll({
    where: { 
      isActive: true,
      isOnSale: true 
    },
    limit: limit,
    order: [['createdAt', 'DESC']]
  });
};

// Find products by category
Product.findByCategory = async function(categoryId, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      categoryId: categoryId,
      isActive: true 
    },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find products by subcategory
Product.findBySubcategory = async function(subCategoryId, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      subCategoryId: subCategoryId,
      isActive: true 
    },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Search products
Product.searchProducts = async function(searchTerm, limit = 20, offset = 0) {
  return await this.findAndCountAll({
    where: {
      [sequelize.Op.or]: [
        {
          name: {
            [sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          description: {
            [sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          genre: {
            [sequelize.Op.iLike]: `%${searchTerm}%`
          }
        }
      ],
      isActive: true
    },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find low stock products
Product.findLowStockProducts = async function() {
  return await this.findAll({
    where: sequelize.literal('stock_quantity <= low_stock_threshold AND stock_quantity > 0'),
    order: [['stockQuantity', 'ASC']]
  });
};

// Find out of stock products
Product.findOutOfStockProducts = async function() {
  return await this.findAll({
    where: { stockQuantity: 0 },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = Product;
