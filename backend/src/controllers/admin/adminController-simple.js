const { 
  User, 
  Product, 
  Order, 
  OrderItem, 
  Category, 
  SubCategory, 
  Review, 
  InventoryTransaction,
  ActivityLog 
} = require('../../models');
const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');
const logger = require('../../utils/logger/logger');

class AdminController {

  async getDashboard(req, res) {
    try {
      const adminId = req.user.id;

      // Get basic counts
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalReviews
      ] = await Promise.all([
        User.count({ where: { role: 'buyer' } }),
        Product.count(),
        Order.count(),
        Category.count(),
        Review.count()
      ]);

      // Get recent orders
      const recentOrders = await Order.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      // Log admin dashboard access (commented out due to enum issue)
      // await ActivityLog.createUserActivity(
      //   adminId,
      //   'admin_dashboard_access',
      //   'Admin accessed dashboard',
      //   { 
      //     dashboardData: {
      //       totalUsers,
      //       totalProducts,
      //       totalOrders
      //     }
      //   }
      // );

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalCategories,
            totalReviews
          },
          recentOrders: recentOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            total: order.total,
            createdAt: order.createdAt,
            user: order.user ? {
              id: order.user.id,
              firstName: order.user.firstName,
              lastName: order.user.lastName,
              email: order.user.email
            } : null
          }))
        }
      });
    } catch (error) {
      logger.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message
      });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'isVerified', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error.message
      });
    }
  }

  async getProducts(req, res) {
    try {
      const products = await Product.findAll({
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
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { products }
      });
    } catch (error) {
      logger.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: error.message
      });
    }
  }

  async createProduct(req, res) {
    try {
      const {
        name, slug, description, price, comparePrice, categoryId,
        subCategoryId, stockQuantity, isActive = true, mainImage,
        images, specifications, features, systemRequirements, sku
      } = req.body;

      if (!name || !price || !categoryId) {
        return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
      }

      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }

      const product = await Product.create({
        name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), description,
        price: parseFloat(price), comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        categoryId, subCategoryId, stockQuantity: parseInt(stockQuantity) || 0,
        isActive, images: images || [], specifications: specifications || {},
        features: features || [], systemRequirements: systemRequirements || {}, mainImage,
        sku: sku || `SKU-${Date.now()}`
      });

      const createdProduct = await Product.findByPk(product.id, {
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }, { model: SubCategory, as: 'subCategory', attributes: ['id', 'name', 'slug'] }]
      });

      res.status(201).json({ success: true, message: 'Product created successfully', data: createdProduct });
    } catch (error) {
      logger.error('Create product error:', error);
      res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
    }
  }

  async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id, {
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }, { model: SubCategory, as: 'subCategory', attributes: ['id', 'name', 'slug'] }]
      });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      logger.error('Get product error:', error);
      res.status(500).json({ success: false, message: 'Failed to get product', error: error.message });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      await product.update(updateData);
      const updatedProduct = await Product.findByPk(id, {
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }, { model: SubCategory, as: 'subCategory', attributes: ['id', 'name', 'slug'] }]
      });
      res.json({ success: true, message: 'Product updated successfully', data: updatedProduct });
    } catch (error) {
      logger.error('Update product error:', error);
      res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const orderItems = await OrderItem.count({ where: { productId: id } });
      if (orderItems > 0) {
        return res.status(400).json({ success: false, message: 'Cannot delete product with existing orders' });
      }
      await product.destroy();
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      logger.error('Delete product error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const orders = await Order.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { orders }
      });
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        error: error.message
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: SubCategory,
            as: 'subCategories',
            attributes: ['id', 'name', 'slug', 'isActive']
          }
        ],
        order: [['name', 'ASC']]
      });

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: error.message
      });
    }
  }

  async getReviews(req, res) {
    try {
      const reviews = await Review.findAll({
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
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: { reviews }
      });
    } catch (error) {
      logger.error('Get reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get reviews',
        error: error.message
      });
    }
  }

  // Placeholder methods for other admin endpoints
  async getUserStats(req, res) {
    res.json({ success: true, data: { stats: {} } });
  }

  async getProductStats(req, res) {
    res.json({ success: true, data: { stats: {} } });
  }

  async getOrderStats(req, res) {
    res.json({ success: true, data: { stats: {} } });
  }

  async getCategoryStats(req, res) {
    res.json({ success: true, data: { stats: {} } });
  }

  async getReviewStats(req, res) {
    res.json({ success: true, data: { stats: {} } });
  }

  async getSalesAnalytics(req, res) {
    res.json({ success: true, data: { analytics: {} } });
  }

  async getRevenueAnalytics(req, res) {
    res.json({ success: true, data: { analytics: {} } });
  }

  async getProductAnalytics(req, res) {
    res.json({ success: true, data: { analytics: {} } });
  }

  async getUserAnalytics(req, res) {
    res.json({ success: true, data: { analytics: {} } });
  }

  async getInventory(req, res) {
    res.json({ success: true, data: { inventory: {} } });
  }

  async getLowStock(req, res) {
    res.json({ success: true, data: { lowStock: [] } });
  }

  async getOutOfStock(req, res) {
    res.json({ success: true, data: { outOfStock: [] } });
  }

  async getInventoryTransactions(req, res) {
    res.json({ success: true, data: { transactions: [] } });
  }

  async getSystemOverview(req, res) {
    res.json({ success: true, data: { system: {} } });
  }

  async getSystemHealth(req, res) {
    res.json({ success: true, data: { health: {} } });
  }

  async getSystemLogs(req, res) {
    res.json({ success: true, data: { logs: [] } });
  }

  async getActivityLogs(req, res) {
    res.json({ success: true, data: { logs: [] } });
  }

  async getUserActivityLogs(req, res) {
    res.json({ success: true, data: { logs: [] } });
  }

  async getSalesReport(req, res) {
    res.json({ success: true, data: { report: {} } });
  }

  async getInventoryReport(req, res) {
    res.json({ success: true, data: { report: {} } });
  }

  async getUserReport(req, res) {
    res.json({ success: true, data: { report: {} } });
  }

  async exportSales(req, res) {
    res.json({ success: true, data: { export: {} } });
  }

  async exportInventory(req, res) {
    res.json({ success: true, data: { export: {} } });
  }

  async exportUsers(req, res) {
    res.json({ success: true, data: { export: {} } });
  }
}

module.exports = new AdminController(); 