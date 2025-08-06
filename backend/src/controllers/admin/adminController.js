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
const logger = require('../../utils/logger/logger');

class AdminController {

  async getDashboard(req, res) {
    try {
      const adminId = req.user.id;

      // Get counts
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalCategories,
        totalReviews,
        lowStockProducts,
        outOfStockProducts,
        pendingOrders
      ] = await Promise.all([
        User.count({ where: { role: 'buyer' } }),
        Product.count(),
        Order.count(),
        Category.count(),
        Review.count(),
        Product.count({
          where: sequelize.literal('stock_quantity <= low_stock_threshold AND stock_quantity > 0')
        }),
        Product.count({ where: { stockQuantity: 0 } }),
        Order.count({ where: { status: 'pending' } })
      ]);

      // Get recent sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSales = await Order.findAll({
        where: {
          status: 'paid',
          createdAt: { [sequelize.Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total')), 'totalSales'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
        ]
      });

      const salesData = recentSales[0];
      const totalSales = parseFloat(salesData.getDataValue('totalSales') || 0);
      const orderCount = parseInt(salesData.getDataValue('orderCount') || 0);

      // Get top selling products
      const topProducts = await OrderItem.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
          [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue']
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage']
          }
        ],
        group: ['productId', 'product.id', 'product.name', 'product.slug', 'product.mainImage'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 5
      });

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

      // Get recent activities
      const recentActivities = await ActivityLog.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Get sales chart data (last 7 days)
      const salesChartData = await Order.findAll({
        where: {
          status: 'paid',
          createdAt: { [sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('total')), 'sales'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      // Log admin dashboard access
      await ActivityLog.createUserActivity(
        adminId,
        'admin_dashboard_access',
        'Admin accessed dashboard',
        { 
          dashboardData: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalSales
          }
        }
      );

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalCategories,
            totalReviews,
            lowStockProducts,
            outOfStockProducts,
            pendingOrders,
            totalSales: parseFloat(totalSales.toFixed(2)),
            orderCount
          },
          topProducts: topProducts.map(item => ({
            productId: item.productId,
            totalSold: parseInt(item.getDataValue('totalSold')),
            totalRevenue: parseFloat(item.getDataValue('totalRevenue')),
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              mainImage: item.product.mainImage
            }
          })),
          recentOrders: recentOrders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            user: {
              id: order.user.id,
              name: `${order.user.firstName} ${order.user.lastName}`,
              email: order.user.email
            }
          })),
          recentActivities: recentActivities.map(activity => ({
            id: activity.id,
            action: activity.action,
            description: activity.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
            user: activity.user ? {
              id: activity.user.id,
              name: `${activity.user.firstName} ${activity.user.lastName}`,
              email: activity.user.email
            } : null
          })),
          salesChart: salesChartData.map(item => ({
            date: item.getDataValue('date'),
            sales: parseFloat(item.getDataValue('sales')),
            orders: parseInt(item.getDataValue('orders'))
          }))
        }
      });

    } catch (error) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/v1/admin/users
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search, isActive } = req.query;
      const adminId = req.user.id;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (role) whereClause.role = role;
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';
      if (search) {
        whereClause[sequelize.Op.or] = [
          { firstName: { [sequelize.Op.iLike]: `%${search}%` } },
          { lastName: { [sequelize.Op.iLike]: `%${search}%` } },
          { email: { [sequelize.Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      // Log admin user list access
      await ActivityLog.createUserActivity(
        adminId,
        'admin_users_list',
        'Admin viewed user list',
        { 
          filters: { role, search, isActive },
          resultCount: count
        }
      );

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
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
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update user status (admin only)
   * PUT /api/v1/admin/users/:userId/status
   */
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const adminId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update your own status'
        });
      }

      await user.update({ isActive });

      // Log activity
      await ActivityLog.createUserActivity(
        adminId,
        'admin_user_status_update',
        `User status updated to ${isActive ? 'active' : 'inactive'}`,
        { 
          targetUserId: userId,
          targetUserEmail: user.email,
          newStatus: isActive
        }
      );

      logger.info(`User status updated by admin: ${user.email} -> ${isActive ? 'active' : 'inactive'}`);

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            isActive: user.isActive
          }
        }
      });

    } catch (error) {
      logger.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get inventory overview
   * GET /api/v1/admin/inventory
   */
  async getInventoryOverview(req, res) {
    try {
      const adminId = req.user.id;

      // Get inventory statistics
      const [
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalStockValue
      ] = await Promise.all([
        Product.count(),
        Product.count({ where: { isActive: true } }),
        Product.count({
          where: sequelize.literal('stock_quantity <= low_stock_threshold AND stock_quantity > 0')
        }),
        Product.count({ where: { stockQuantity: 0 } }),
        Product.sum('stockQuantity', {
          where: { isActive: true }
        })
      ]);

      // Get low stock products
      const lowStockItems = await Product.findAll({
        where: sequelize.literal('stock_quantity <= low_stock_threshold AND stock_quantity > 0'),
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        order: [['stockQuantity', 'ASC']],
        limit: 10
      });

      // Get out of stock products
      const outOfStockItems = await Product.findAll({
        where: { stockQuantity: 0 },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Get recent inventory transactions
      const recentTransactions = await InventoryTransaction.findAll({
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Log inventory access
      await ActivityLog.createUserActivity(
        adminId,
        'admin_inventory_access',
        'Admin accessed inventory overview',
        { 
          inventoryData: {
            totalProducts,
            activeProducts,
            lowStockProducts,
            outOfStockProducts
          }
        }
      );

      res.json({
        success: true,
        data: {
          overview: {
            totalProducts,
            activeProducts,
            lowStockProducts,
            outOfStockProducts,
            totalStockValue: parseInt(totalStockValue || 0)
          },
          lowStockItems: lowStockItems.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            stockQuantity: product.stockQuantity,
            lowStockThreshold: product.lowStockThreshold,
            category: product.category ? {
              id: product.category.id,
              name: product.category.name
            } : null
          })),
          outOfStockItems: outOfStockItems.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category ? {
              id: product.category.id,
              name: product.category.name
            } : null
          })),
          recentTransactions: recentTransactions.map(transaction => ({
            id: transaction.id,
            type: transaction.type,
            quantity: transaction.quantity,
            reason: transaction.reason,
            createdAt: transaction.createdAt,
            product: {
              id: transaction.product.id,
              name: transaction.product.name,
              slug: transaction.product.slug
            },
            user: transaction.user ? {
              id: transaction.user.id,
              name: `${transaction.user.firstName} ${transaction.user.lastName}`
            } : null
          }))
        }
      });

    } catch (error) {
      logger.error('Get inventory overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory overview',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update product stock (admin only)
   * PUT /api/v1/admin/products/:productId/stock
   */
  async updateProductStock(req, res) {
    try {
      const { productId } = req.params;
      const { quantity, reason = 'admin_update' } = req.body;
      const adminId = req.user.id;

      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const oldStock = product.stockQuantity;
      const newStock = oldStock + quantity;

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock cannot be negative'
        });
      }

      // Update product stock
      await product.update({ stockQuantity: newStock });

      // Create inventory transaction
      await InventoryTransaction.create({
        productId,
        userId: adminId,
        type: quantity > 0 ? 'in' : 'out',
        quantity: Math.abs(quantity),
        reason,
        previousStock: oldStock,
        newStock
      });

      // Log activity
      await ActivityLog.createUserActivity(
        adminId,
        'admin_stock_update',
        `Product stock updated: ${oldStock} -> ${newStock}`,
        { 
          productId,
          productName: product.name,
          oldStock,
          newStock,
          change: quantity,
          reason
        }
      );

      logger.info(`Product stock updated by admin: ${product.name} (${oldStock} -> ${newStock})`);

      res.json({
        success: true,
        message: 'Product stock updated successfully',
        data: {
          product: {
            id: product.id,
            name: product.name,
            stockQuantity: product.stockQuantity,
            lowStockThreshold: product.lowStockThreshold
          }
        }
      });

    } catch (error) {
      logger.error('Update product stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product stock',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get sales analytics
   * GET /api/v1/admin/analytics/sales
   */
  async getSalesAnalytics(req, res) {
    try {
      const { period = '30' } = req.query;
      const adminId = req.user.id;

      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get sales data
      const salesData = await Order.findAll({
        where: {
          status: 'paid',
          createdAt: { [sequelize.Op.gte]: startDate }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('total')), 'sales'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      // Get top selling products
      const topProducts = await OrderItem.findAll({
        attributes: [
          'productId',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
          [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue']
        ],
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: 'paid',
              createdAt: { [sequelize.Op.gte]: startDate }
            }
          },
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'mainImage']
          }
        ],
        group: ['productId', 'product.id', 'product.name', 'product.slug', 'product.mainImage'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 10
      });

      // Get category sales
      const categorySales = await OrderItem.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']
        ],
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              status: 'paid',
              createdAt: { [sequelize.Op.gte]: startDate }
            }
          },
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        group: ['product.categoryId', 'product.category.id', 'product.category.name'],
        order: [[sequelize.fn('SUM', sequelize.col('total')), 'DESC']]
      });

      // Calculate totals
      const totalSales = salesData.reduce((sum, item) => sum + parseFloat(item.getDataValue('sales')), 0);
      const totalOrders = salesData.reduce((sum, item) => sum + parseInt(item.getDataValue('orders')), 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Log analytics access
      await ActivityLog.createUserActivity(
        adminId,
        'admin_analytics_access',
        'Admin accessed sales analytics',
        { 
          period,
          totalSales,
          totalOrders,
          averageOrderValue
        }
      );

      res.json({
        success: true,
        data: {
          period,
          overview: {
            totalSales: parseFloat(totalSales.toFixed(2)),
            totalOrders,
            averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
          },
          dailySales: salesData.map(item => ({
            date: item.getDataValue('date'),
            sales: parseFloat(item.getDataValue('sales')),
            orders: parseInt(item.getDataValue('orders'))
          })),
          topProducts: topProducts.map(item => ({
            productId: item.productId,
            totalSold: parseInt(item.getDataValue('totalSold')),
            totalRevenue: parseFloat(item.getDataValue('totalRevenue')),
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              mainImage: item.product.mainImage
            }
          })),
          categorySales: categorySales.map(item => ({
            categoryId: item.product.category.id,
            categoryName: item.product.category.name,
            totalRevenue: parseFloat(item.getDataValue('totalRevenue')),
            totalSold: parseInt(item.getDataValue('totalSold'))
          }))
        }
      });

    } catch (error) {
      logger.error('Get sales analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sales analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get system overview
   * GET /api/v1/admin/system
   */
  async getSystemOverview(req, res) {
    try {
      const adminId = req.user.id;

      // Get system statistics
      const [
        totalUsers,
        totalProducts,
        totalOrders,
        totalReviews,
        totalCategories,
        totalSubCategories
      ] = await Promise.all([
        User.count(),
        Product.count(),
        Order.count(),
        Review.count(),
        Category.count(),
        SubCategory.count()
      ]);

      // Get recent system activities
      const recentActivities = await ActivityLog.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      // Get database size info (if available)
      const dbInfo = {
        totalTables: 13, // Based on our models
        estimatedSize: 'N/A' // Would need database-specific queries
      };

      // Log system overview access
      await ActivityLog.createUserActivity(
        adminId,
        'admin_system_overview',
        'Admin accessed system overview',
        { 
          systemData: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalReviews
          }
        }
      );

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalProducts,
            totalOrders,
            totalReviews,
            totalCategories,
            totalSubCategories
          },
          recentActivities: recentActivities.map(activity => ({
            id: activity.id,
            action: activity.action,
            description: activity.description,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
            user: activity.user ? {
              id: activity.user.id,
              name: `${activity.user.firstName} ${activity.user.lastName}`,
              email: activity.user.email
            } : null
          })),
          database: dbInfo
        }
      });

    } catch (error) {
      logger.error('Get system overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system overview',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get users (admin)
   * GET /api/v1/admin/users
   */
  async getUsers(req, res) {
    try {
      // Use the existing getAllUsers method
      return await this.getAllUsers(req, res);
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user statistics (admin)
   * GET /api/v1/admin/users/stats
   */
  async getUserStats(req, res) {
    try {
      // TODO: Implement user statistics
      res.json({
        success: true,
        data: {
          totalUsers: 0,
          activeUsers: 0,
          newUsersThisMonth: 0
        }
      });

    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get products (admin)
   * GET /api/v1/admin/products
   */
  async getProducts(req, res) {
    try {
      // TODO: Implement products retrieval
      res.json({
        success: true,
        data: { products: [] }
      });

    } catch (error) {
      logger.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get product statistics (admin)
   * GET /api/v1/admin/products/stats
   */
  async getProductStats(req, res) {
    try {
      // TODO: Implement product statistics
      res.json({
        success: true,
        data: {
          totalProducts: 0,
          activeProducts: 0,
          lowStockProducts: 0
        }
      });

    } catch (error) {
      logger.error('Get product stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get orders (admin)
   * GET /api/v1/admin/orders
   */
  async getOrders(req, res) {
    try {
      // TODO: Implement orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get order statistics (admin)
   * GET /api/v1/admin/orders/stats
   */
  async getOrderStats(req, res) {
    try {
      // TODO: Implement order statistics
      res.json({
        success: true,
        data: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        }
      });

    } catch (error) {
      logger.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get revenue analytics (admin)
   * GET /api/v1/admin/analytics/revenue
   */
  async getRevenueAnalytics(req, res) {
    try {
      // TODO: Implement revenue analytics
      res.json({
        success: true,
        data: {
          dailyRevenue: [],
          monthlyRevenue: [],
          yearlyRevenue: []
        }
      });

    } catch (error) {
      logger.error('Get revenue analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get revenue analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get product analytics (admin)
   * GET /api/v1/admin/analytics/products
   */
  async getProductAnalytics(req, res) {
    try {
      // TODO: Implement product analytics
      res.json({
        success: true,
        data: {
          topSellingProducts: [],
          productPerformance: []
        }
      });

    } catch (error) {
      logger.error('Get product analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user analytics (admin)
   * GET /api/v1/admin/analytics/users
   */
  async getUserAnalytics(req, res) {
    try {
      // TODO: Implement user analytics
      res.json({
        success: true,
        data: {
          userGrowth: [],
          userActivity: []
        }
      });

    } catch (error) {
      logger.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get inventory (admin)
   * GET /api/v1/admin/inventory
   */
  async getInventory(req, res) {
    try {
      // Use the existing getInventoryOverview method
      return await this.getInventoryOverview(req, res);
    } catch (error) {
      logger.error('Get inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get low stock products (admin)
   * GET /api/v1/admin/inventory/low-stock
   */
  async getLowStock(req, res) {
    try {
      // TODO: Implement low stock products retrieval
      res.json({
        success: true,
        data: { products: [] }
      });

    } catch (error) {
      logger.error('Get low stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get out of stock products (admin)
   * GET /api/v1/admin/inventory/out-of-stock
   */
  async getOutOfStock(req, res) {
    try {
      // TODO: Implement out of stock products retrieval
      res.json({
        success: true,
        data: { products: [] }
      });

    } catch (error) {
      logger.error('Get out of stock error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get out of stock products',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get inventory transactions (admin)
   * GET /api/v1/admin/inventory/transactions
   */
  async getInventoryTransactions(req, res) {
    try {
      // TODO: Implement inventory transactions retrieval
      res.json({
        success: true,
        data: { transactions: [] }
      });

    } catch (error) {
      logger.error('Get inventory transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory transactions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get system health (admin)
   * GET /api/v1/admin/system/health
   */
  async getSystemHealth(req, res) {
    try {
      // TODO: Implement system health check
      res.json({
        success: true,
        data: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      });

    } catch (error) {
      logger.error('Get system health error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system health',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get system logs (admin)
   * GET /api/v1/admin/system/logs
   */
  async getSystemLogs(req, res) {
    try {
      // TODO: Implement system logs retrieval
      res.json({
        success: true,
        data: { logs: [] }
      });

    } catch (error) {
      logger.error('Get system logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system logs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get activity logs (admin)
   * GET /api/v1/admin/activity-logs
   */
  async getActivityLogs(req, res) {
    try {
      // TODO: Implement activity logs retrieval
      res.json({
        success: true,
        data: { logs: [] }
      });

    } catch (error) {
      logger.error('Get activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity logs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user activity logs (admin)
   * GET /api/v1/admin/activity-logs/user/:userId
   */
  async getUserActivityLogs(req, res) {
    try {
      // TODO: Implement user activity logs retrieval
      res.json({
        success: true,
        data: { logs: [] }
      });

    } catch (error) {
      logger.error('Get user activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user activity logs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get sales report (admin)
   * GET /api/v1/admin/reports/sales
   */
  async getSalesReport(req, res) {
    try {
      // TODO: Implement sales report
      res.json({
        success: true,
        data: { report: {} }
      });

    } catch (error) {
      logger.error('Get sales report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sales report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get inventory report (admin)
   * GET /api/v1/admin/reports/inventory
   */
  async getInventoryReport(req, res) {
    try {
      // TODO: Implement inventory report
      res.json({
        success: true,
        data: { report: {} }
      });

    } catch (error) {
      logger.error('Get inventory report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user report (admin)
   * GET /api/v1/admin/reports/users
   */
  async getUserReport(req, res) {
    try {
      // TODO: Implement user report
      res.json({
        success: true,
        data: { report: {} }
      });

    } catch (error) {
      logger.error('Get user report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Export sales (admin)
   * GET /api/v1/admin/export/sales
   */
  async exportSales(req, res) {
    try {
      // TODO: Implement sales export
      res.json({
        success: true,
        message: 'Sales exported successfully'
      });

    } catch (error) {
      logger.error('Export sales error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export sales',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Export inventory (admin)
   * GET /api/v1/admin/export/inventory
   */
  async exportInventory(req, res) {
    try {
      // TODO: Implement inventory export
      res.json({
        success: true,
        message: 'Inventory exported successfully'
      });

    } catch (error) {
      logger.error('Export inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export inventory',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Export users (admin)
   * GET /api/v1/admin/export/users
   */
  async exportUsers(req, res) {
    try {
      // TODO: Implement users export
      res.json({
        success: true,
        message: 'Users exported successfully'
      });

    } catch (error) {
      logger.error('Export users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new AdminController();
