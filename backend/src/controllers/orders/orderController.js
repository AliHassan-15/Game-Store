const { Order, OrderItem, Cart, CartItem, Product, User, UserAddress, ActivityLog } = require('../../models');
const { stripeUtils } = require('../../config/stripe');
const logger = require('../../utils/logger/logger');
class OrderController {

  async createOrder(req, res) {
    try {
      const userId = req.user.id;
      const { 
        shippingAddressId, 
        billingAddressId, 
        paymentMethodId,
        notes,
        useDefaultAddresses = true 
      } = req.body;

      // Get user's cart
      const cart = await Cart.findOne({
        where: { userId, isActive: true },
        include: [
          {
            model: CartItem,
            as: 'cartItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'price', 'stockQuantity', 'isActive']
              }
            ]
          }
        ]
      });

      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // Validate cart items
      const validItems = [];
      const invalidItems = [];
      let subtotal = 0;

      for (const item of cart.cartItems) {
        if (!item.product || !item.product.isActive) {
          invalidItems.push({
            productId: item.productId,
            reason: 'Product not available'
          });
          continue;
        }

        if (item.product.stockQuantity < item.quantity) {
          invalidItems.push({
            productId: item.productId,
            reason: `Only ${item.product.stockQuantity} items available`
          });
          continue;
        }

        validItems.push(item);
        subtotal += item.product.price * item.quantity;
      }

      if (invalidItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some items in your cart are no longer available',
          data: { invalidItems }
        });
      }

      // Get user addresses
      let shippingAddress, billingAddress;
      
      if (useDefaultAddresses) {
        shippingAddress = await UserAddress.findOne({
          where: { userId, isDefault: true, type: 'shipping' }
        });
        billingAddress = await UserAddress.findOne({
          where: { userId, isDefault: true, type: 'billing' }
        });
      } else {
        if (shippingAddressId) {
          shippingAddress = await UserAddress.findOne({
            where: { id: shippingAddressId, userId }
          });
        }
        if (billingAddressId) {
          billingAddress = await UserAddress.findOne({
            where: { id: billingAddressId, userId }
          });
        }
      }

      if (!shippingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Shipping address is required'
        });
      }

      // Use shipping address as billing address if billing not provided
      if (!billingAddress) {
        billingAddress = shippingAddress;
      }

      // Calculate totals
      const tax = subtotal * 0.1; // 10% tax (configurable)
      const shipping = 0; // Free shipping for now
      const total = subtotal + tax + shipping;

      // Create order
      const order = await Order.create({
        userId,
        orderNumber: this.generateOrderNumber(),
        status: 'pending',
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shipping: parseFloat(shipping.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        shippingAddress: shippingAddress.toJSON(),
        billingAddress: billingAddress.toJSON(),
        notes: notes || null,
        paymentMethodId: paymentMethodId || null
      });

      // Create order items
      const orderItems = [];
      for (const item of validItems) {
        const orderItem = await OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity
        });
        orderItems.push(orderItem);

        // Decrease product stock
        await item.product.decreaseStock(item.quantity);
      }

      // Clear cart
      await CartItem.destroy({
        where: { cartId: cart.id }
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'order_create',
        'Order created successfully',
        { 
          orderId: order.id, 
          orderNumber: order.orderNumber,
          total: order.total,
          itemCount: orderItems.length
        }
      );

      logger.info(`Order created: ${order.orderNumber}, User: ${userId}, Total: $${order.total}`);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
            createdAt: order.createdAt
          },
          items: orderItems.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          }))
        }
      });

    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Process payment for order
   * POST /api/v1/orders/:orderId/pay
   */
  async processPayment(req, res) {
    try {
      const { orderId } = req.params;
      const { paymentIntentId } = req.body;
      const userId = req.user.id;

      // Find order
      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Order cannot be paid'
        });
      }

      // Verify payment with Stripe
      const paymentResult = await stripeUtils.confirmPaymentIntent(paymentIntentId);
      
      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentResult.error
        });
      }

      // Update order status
      await order.update({
        status: 'paid',
        paymentIntentId: paymentIntentId,
        paidAt: new Date()
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'order_payment',
        'Order payment processed successfully',
        { 
          orderId: order.id, 
          orderNumber: order.orderNumber,
          paymentIntentId,
          amount: order.total
        }
      );

      logger.info(`Order payment processed: ${order.orderNumber}, Payment: ${paymentIntentId}`);

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            paidAt: order.paidAt
          }
        }
      });

    } catch (error) {
      logger.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user's orders
   * GET /api/v1/orders
   */
  async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { userId };

      if (status) {
        whereClause.status = status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug', 'mainImage']
              }
            ]
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
          orders: orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            itemCount: order.orderItems.length,
            items: order.orderItems.map(item => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              product: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                mainImage: item.product.mainImage
              }
            }))
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
      logger.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get order details
   * GET /api/v1/orders/:orderId
   */
  async getOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug', 'mainImage', 'description']
              }
            ]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            paidAt: order.paidAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            items: order.orderItems.map(item => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              product: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                mainImage: item.product.mainImage,
                description: item.product.description
              }
            }))
          }
        }
      });

    } catch (error) {
      logger.error('Get order details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Cancel order (only if not shipped)
   * POST /api/v1/orders/:orderId/cancel
   */
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id: orderId, userId },
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status === 'shipped' || order.status === 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel shipped or delivered order'
        });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Order is already cancelled'
        });
      }

      // Update order status
      await order.update({
        status: 'cancelled',
        cancelledAt: new Date()
      });

      // Restore product stock
      for (const item of order.orderItems) {
        await item.product.increaseStock(item.quantity);
      }

      // Process refund if order was paid
      if (order.status === 'paid' && order.paymentIntentId) {
        try {
          await stripeUtils.createRefund(
            order.paymentIntentId,
            order.total,
            'requested_by_customer'
          );
        } catch (refundError) {
          logger.error('Refund failed:', refundError);
          // Continue with cancellation even if refund fails
        }
      }

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'order_cancel',
        'Order cancelled by user',
        { 
          orderId: order.id, 
          orderNumber: order.orderNumber,
          previousStatus: order.status
        }
      );

      logger.info(`Order cancelled: ${order.orderNumber}, User: ${userId}`);

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            cancelledAt: order.cancelledAt
          }
        }
      });

    } catch (error) {
      logger.error('Cancel order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Admin: Get all orders
   * GET /api/v1/admin/orders
   */
  async getAllOrders(req, res) {
    try {
      const { page = 1, limit = 20, status, userId } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (userId) whereClause.userId = userId;

      const { count, rows: orders } = await Order.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug']
              }
            ]
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
          orders: orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            user: {
              id: order.user.id,
              name: `${order.user.firstName} ${order.user.lastName}`,
              email: order.user.email
            },
            itemCount: order.orderItems.length
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
      logger.error('Get all orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Admin: Update order status
   * PUT /api/v1/admin/orders/:orderId/status
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const adminId = req.user.id;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Validate status transition
      const validTransitions = {
        'pending': ['paid', 'cancelled'],
        'paid': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': [],
        'cancelled': []
      };

      if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${order.status} to ${status}`
        });
      }

      // Update order status
      const updateData = { status };
      
      if (status === 'shipped') {
        updateData.shippedAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      await order.update(updateData);

      // Log activity
      await ActivityLog.createUserActivity(
        adminId,
        'order_status_update',
        `Order status updated to ${status}`,
        { 
          orderId: order.id, 
          orderNumber: order.orderNumber,
          previousStatus: order.status,
          newStatus: status
        }
      );

      logger.info(`Order status updated: ${order.orderNumber} -> ${status} by admin ${adminId}`);

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            updatedAt: order.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Generate unique order number
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Create order from cart
   * POST /api/v1/orders/create-from-cart
   */
  async createOrderFromCart(req, res) {
    try {
      // Use the existing createOrder method
      return await this.createOrder(req, res);
    } catch (error) {
      logger.error('Create order from cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order from cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get my orders (buyer)
   * GET /api/v1/orders/my-orders
   */
  async getMyOrders(req, res) {
    try {
      // Use the existing getUserOrders method
      return await this.getUserOrders(req, res);
    } catch (error) {
      logger.error('Get my orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get my order by ID (buyer)
   * GET /api/v1/orders/my-orders/:orderId
   */
  async getMyOrderById(req, res) {
    try {
      // Use the existing getOrderDetails method
      return await this.getOrderDetails(req, res);
    } catch (error) {
      logger.error('Get my order by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get my order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Request refund (buyer)
   * POST /api/v1/orders/my-orders/:orderId/request-refund
   */
  async requestRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id: orderId, userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // TODO: Implement refund request logic
      res.json({
        success: true,
        message: 'Refund request submitted successfully'
      });

    } catch (error) {
      logger.error('Request refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to request refund',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get order by ID (admin)
   * GET /api/v1/orders/:orderId
   */
  async getOrderById(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: Product,
                as: 'product'
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: { order }
      });

    } catch (error) {
      logger.error('Get order by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update shipping info (admin)
   * PUT /api/v1/orders/:orderId/shipping
   */
  async updateShippingInfo(req, res) {
    try {
      const { orderId } = req.params;
      const updateData = req.body;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // TODO: Implement shipping info update logic
      res.json({
        success: true,
        message: 'Shipping info updated successfully'
      });

    } catch (error) {
      logger.error('Update shipping info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update shipping info',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Process refund (admin)
   * POST /api/v1/orders/:orderId/refund
   */
  async processRefund(req, res) {
    try {
      const { orderId } = req.params;
      const { amount, reason } = req.body;

      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // TODO: Implement refund processing logic
      res.json({
        success: true,
        message: 'Refund processed successfully'
      });

    } catch (error) {
      logger.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get order statistics (admin)
   * GET /api/v1/orders/stats/overview
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
   * Get revenue statistics (admin)
   * GET /api/v1/orders/stats/revenue
   */
  async getRevenueStats(req, res) {
    try {
      // TODO: Implement revenue statistics
      res.json({
        success: true,
        data: {
          dailyRevenue: [],
          monthlyRevenue: [],
          yearlyRevenue: []
        }
      });

    } catch (error) {
      logger.error('Get revenue stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get revenue statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get status statistics (admin)
   * GET /api/v1/orders/stats/status
   */
  async getStatusStats(req, res) {
    try {
      // TODO: Implement status statistics
      res.json({
        success: true,
        data: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          refunded: 0
        }
      });

    } catch (error) {
      logger.error('Get status stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get status statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get pending orders (admin)
   * GET /api/v1/orders/pending
   */
  async getPendingOrders(req, res) {
    try {
      // TODO: Implement pending orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get pending orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get processing orders (admin)
   * GET /api/v1/orders/processing
   */
  async getProcessingOrders(req, res) {
    try {
      // TODO: Implement processing orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get processing orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get processing orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get shipped orders (admin)
   * GET /api/v1/orders/shipped
   */
  async getShippedOrders(req, res) {
    try {
      // TODO: Implement shipped orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get shipped orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get shipped orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get delivered orders (admin)
   * GET /api/v1/orders/delivered
   */
  async getDeliveredOrders(req, res) {
    try {
      // TODO: Implement delivered orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get delivered orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get delivered orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get cancelled orders (admin)
   * GET /api/v1/orders/cancelled
   */
  async getCancelledOrders(req, res) {
    try {
      // TODO: Implement cancelled orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get cancelled orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cancelled orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get refunded orders (admin)
   * GET /api/v1/orders/refunded
   */
  async getRefundedOrders(req, res) {
    try {
      // TODO: Implement refunded orders retrieval
      res.json({
        success: true,
        data: { orders: [] }
      });

    } catch (error) {
      logger.error('Get refunded orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get refunded orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Export orders to Excel (admin)
   * GET /api/v1/orders/export/excel
   */
  async exportOrdersToExcel(req, res) {
    try {
      // TODO: Implement Excel export
      res.json({
        success: true,
        message: 'Orders exported successfully'
      });

    } catch (error) {
      logger.error('Export orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Track order (public)
   * GET /api/v1/orders/track/:trackingNumber
   */
  async trackOrder(req, res) {
    try {
      const { trackingNumber } = req.params;

      const order = await Order.findOne({
        where: { trackingNumber }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            trackingNumber: order.trackingNumber,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt
          }
        }
      });

    } catch (error) {
      logger.error('Track order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new OrderController();
