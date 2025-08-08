const { Product, Category, SubCategory, Review, InventoryTransaction, ActivityLog } = require('../../models');
const logger = require('../../utils/logger/logger');

/**
 * Product Controller - Handles product management and operations
 * 
 * Features:
 * - Product CRUD operations
 * - Product search and filtering
 * - Inventory management
 * - Product analytics
 * - Image upload handling
 */
class ProductController {

  /**
   * Get all products with pagination and filtering
   * GET /api/v1/products
   */
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        subCategory,
        search,
        minPrice,
        maxPrice,
        platform,
        genre,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        isActive = 'true'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { isActive: isActive === 'true' || isActive === true };

      // Add filters
      if (category) whereClause.categoryId = category;
      if (subCategory) whereClause.subCategoryId = subCategory;
      if (platform) whereClause.platform = platform;
      if (genre) whereClause.genre = genre;
      if (minPrice || maxPrice) {
        whereClause.price = {};
        if (minPrice) whereClause.price[require('sequelize').Op.gte] = parseFloat(minPrice);
        if (maxPrice) whereClause.price[require('sequelize').Op.lte] = parseFloat(maxPrice);
      }

      // Add search functionality
      if (search) {
        whereClause[require('sequelize').Op.or] = [
          { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { description: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { genre: { [require('sequelize').Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SubCategory,
            as: 'subCategory',
            attributes: ['id', 'name', 'slug']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      // Get average ratings for products
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const ratingData = await product.getWithRating();
          return ratingData;
        })
      );

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          products: productsWithRatings,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get product by ID
   * GET /api/v1/products/:id
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: SubCategory,
            as: 'subCategory',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: Review,
            as: 'reviews',
            where: { isActive: true, isApproved: true },
            required: false,
            include: [
              {
                model: require('../../models').User,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'avatar']
              }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Increment view count
      await product.incrementViewCount();

      // Get product with rating
      const productWithRating = await product.getWithRating();

      res.json({
        success: true,
        data: {
          product: productWithRating
        }
      });

    } catch (error) {
      logger.error('Get product by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get product by slug
   * GET /api/v1/products/slug/:slug
   */
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;

      const product = await Product.findBySlug(slug);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get product with full details
      const productWithDetails = await product.getWithFullDetails();

      // Increment view count
      await product.incrementViewCount();

      res.json({
        success: true,
        data: {
          product: productWithDetails
        }
      });

    } catch (error) {
      logger.error('Get product by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create new product (Admin only)
   * POST /api/v1/products
   */
  async createProduct(req, res) {
    try {
      const {
        name,
        description,
        shortDescription,
        price,
        comparePrice,
        sku,
        stockQuantity,
        categoryId,
        subCategoryId,
        platform,
        genre,
        publisher,
        developer,
        releaseDate,
        mainImage,
        images,
        specifications,
        isActive = true,
        isFeatured = false
      } = req.body;

      // Check if SKU already exists
      const existingProduct = await Product.findBySku(sku);
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }

      // Create product
      const product = await Product.create({
        name,
        description,
        shortDescription,
        price,
        comparePrice,
        sku,
        stockQuantity,
        categoryId,
        subCategoryId,
        platform,
        genre,
        publisher,
        developer,
        releaseDate,
        mainImage,
        images: images || [],
        specifications: specifications || {},
        isActive,
        isFeatured
      });

      // Create initial inventory transaction
      if (stockQuantity > 0) {
        await InventoryTransaction.createStockIn(
          product.id,
          stockQuantity,
          req.user.id,
          'Initial stock',
          null,
          'manual'
        );
      }

      // Log activity
      await ActivityLog.createUserActivity(
        req.user.id,
        'product_create',
        `Product created: ${name}`,
        { productId: product.id, sku, price }
      );

      logger.info(`Product created: ${name} by user: ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
          product: product.toJSON()
        }
      });

    } catch (error) {
      logger.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update product (Admin only)
   * PUT /api/v1/products/:id
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if SKU is being changed and if it already exists
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await Product.findBySku(updateData.sku);
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this SKU already exists'
          });
        }
      }

      // Handle stock quantity changes
      if (updateData.stockQuantity !== undefined && updateData.stockQuantity !== product.stockQuantity) {
        const quantityDifference = updateData.stockQuantity - product.stockQuantity;
        
        if (quantityDifference > 0) {
          // Stock increase
          await InventoryTransaction.createStockIn(
            product.id,
            quantityDifference,
            req.user.id,
            'Stock adjustment',
            null,
            'adjustment'
          );
        } else if (quantityDifference < 0) {
          // Stock decrease
          await InventoryTransaction.createStockOut(
            product.id,
            Math.abs(quantityDifference),
            req.user.id,
            'Stock adjustment',
            'adjustment'
          );
        }
      }

      // Update product
      await product.update(updateData);

      // Log activity
      await ActivityLog.createUserActivity(
        req.user.id,
        'product_update',
        `Product updated: ${product.name}`,
        { productId: product.id, updatedFields: Object.keys(updateData) }
      );

      logger.info(`Product updated: ${product.name} by user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
          product: product.toJSON()
        }
      });

    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete product (Admin only)
   * DELETE /api/v1/products/:id
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product has orders
      const orderItems = await product.getOrderItems();
      if (orderItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete product with existing orders'
        });
      }

      // Soft delete by setting isActive to false
      await product.update({ isActive: false });

      // Log activity
      await ActivityLog.createUserActivity(
        req.user.id,
        'product_delete',
        `Product deleted: ${product.name}`,
        { productId: product.id, sku: product.sku }
      );

      logger.info(`Product deleted: ${product.name} by user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get featured products
   * GET /api/v1/products/featured
   */
  async getFeaturedProducts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const products = await Product.findFeaturedProducts(parseInt(limit));

      // Get products with ratings
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const ratingData = await product.getWithRating();
          return ratingData;
        })
      );

      res.json({
        success: true,
        data: {
          products: productsWithRatings
        }
      });

    } catch (error) {
      logger.error('Get featured products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get products on sale
   * GET /api/v1/products/on-sale
   */
  async getOnSaleProducts(req, res) {
    try {
      const { limit = 20 } = req.query;

      const products = await Product.findOnSaleProducts(parseInt(limit));

      // Get products with ratings
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const ratingData = await product.getWithRating();
          return ratingData;
        })
      );

      res.json({
        success: true,
        data: {
          products: productsWithRatings
        }
      });

    } catch (error) {
      logger.error('Get on-sale products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get on-sale products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Search products
   * GET /api/v1/products/search
   */
  async searchProducts(req, res) {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        category,
        subCategory,
        minPrice,
        maxPrice,
        platform,
        genre,
        sortBy = 'relevance',
        sortOrder = 'DESC'
      } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const { count, rows: products } = await Product.searchProducts(q, parseInt(limit), (page - 1) * limit);

      // Get products with ratings
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const ratingData = await product.getWithRating();
          return ratingData;
        })
      );

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          products: productsWithRatings,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Search products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get product statistics (Admin only)
   * GET /api/v1/products/statistics
   */
  async getProductStatistics(req, res) {
    try {
      const totalProducts = await Product.count();
      const activeProducts = await Product.count({ where: { isActive: true } });
      const featuredProducts = await Product.count({ where: { isFeatured: true } });
      const onSaleProducts = await Product.count({ where: { isOnSale: true } });
      const outOfStockProducts = await Product.count({ where: { stockQuantity: 0 } });
      const lowStockProducts = await Product.count({
        where: require('sequelize').literal('stock_quantity <= low_stock_threshold AND stock_quantity > 0')
      });

      // Get top selling products
      const topSellingProducts = await Product.findAll({
        order: [['soldCount', 'DESC']],
        limit: 10,
        attributes: ['id', 'name', 'sku', 'soldCount', 'viewCount']
      });

      // Get most viewed products
      const mostViewedProducts = await Product.findAll({
        order: [['viewCount', 'DESC']],
        limit: 10,
        attributes: ['id', 'name', 'sku', 'viewCount', 'soldCount']
      });

      res.json({
        success: true,
        data: {
          totalProducts,
          activeProducts,
          featuredProducts,
          onSaleProducts,
          outOfStockProducts,
          lowStockProducts,
          topSellingProducts,
          mostViewedProducts
        }
      });

    } catch (error) {
      logger.error('Get product statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get low stock products (Admin only)
   * GET /api/v1/products/low-stock
   */
  async getLowStockProducts(req, res) {
    try {
      const products = await Product.findLowStockProducts();

      res.json({
        success: true,
        data: {
          products: products.map(product => product.toJSON())
        }
      });

    } catch (error) {
      logger.error('Get low stock products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get out of stock products (Admin only)
   * GET /api/v1/products/out-of-stock
   */
  async getOutOfStockProducts(req, res) {
    try {
      const products = await Product.findOutOfStockProducts();

      res.json({
        success: true,
        data: {
          products: products.map(product => product.toJSON())
        }
      });

    } catch (error) {
      logger.error('Get out of stock products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get out of stock products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new ProductController();
