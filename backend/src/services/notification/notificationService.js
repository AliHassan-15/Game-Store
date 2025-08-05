const { User, Product, Order, Review } = require('../../models');
const { emailService } = require('../email/emailService');
const { redisUtils } = require('../../config/redis');
const logger = require('../../utils/logger/logger');

class NotificationService {
  /**
   * Send low stock notification
   */
  async sendLowStockNotification(productId) {
    try {
      const product = await Product.findByPk(productId, {
        include: [{ model: require('../../models').Category, as: 'category', attributes: ['name'] }]
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Get admin users
      const adminUsers = await User.findAll({
        where: { role: 'admin', isActive: true }
      });

      const notificationData = {
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `Product "${product.name}" is running low on stock (${product.stockQuantity} remaining)`,
        data: {
          productId: product.id,
          productName: product.name,
          currentStock: product.stockQuantity,
          threshold: product.lowStockThreshold,
          category: product.category?.name
        }
      };

      // Send email notifications to admins
      for (const admin of adminUsers) {
        try {
          await emailService.sendLowStockAlertEmail(admin.email, {
            id: product.id,
            name: product.name,
            sku: product.sku,
            currentStock: product.stockQuantity,
            threshold: product.lowStockThreshold,
            category: product.category?.name
          });

          // Store notification in Redis
          await this.storeNotification(admin.id, notificationData);
        } catch (error) {
          logger.error(`Failed to send low stock notification to ${admin.email}:`, error);
        }
      }

      logger.info(`Low stock notification sent for product: ${product.name}`);
      return { success: true, recipients: adminUsers.length };
    } catch (error) {
      logger.error('Send low stock notification error:', error);
      throw error;
    }
  }

  /**
   * Send out of stock notification
   */
  async sendOutOfStockNotification(productId) {
    try {
      const product = await Product.findByPk(productId, {
        include: [{ model: require('../../models').Category, as: 'category', attributes: ['name'] }]
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Get admin users
      const adminUsers = await User.findAll({
        where: { role: 'admin', isActive: true }
      });

      const notificationData = {
        type: 'out_of_stock',
        title: 'Out of Stock Alert',
        message: `Product "${product.name}" is now out of stock`,
        data: {
          productId: product.id,
          productName: product.name,
          category: product.category?.name
        }
      };

      // Send email notifications to admins
      for (const admin of adminUsers) {
        try {
          await emailService.sendOutOfStockAlertEmail(admin.email, {
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category?.name
          });

          // Store notification in Redis
          await this.storeNotification(admin.id, notificationData);
        } catch (error) {
          logger.error(`Failed to send out of stock notification to ${admin.email}:`, error);
        }
      }

      logger.info(`Out of stock notification sent for product: ${product.name}`);
      return { success: true, recipients: adminUsers.length };
    } catch (error) {
      logger.error('Send out of stock notification error:', error);
      throw error;
    }
  }

  /**
   * Send new review notification
   */
  async sendNewReviewNotification(reviewId) {
    try {
      const review = await Review.findByPk(reviewId, {
        include: [
          { model: User, as: 'user', attributes: ['firstName', 'lastName'] },
          { model: Product, as: 'product', attributes: ['name', 'id'] }
        ]
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Get admin users
      const adminUsers = await User.findAll({
        where: { role: 'admin', isActive: true }
      });

      const notificationData = {
        type: 'new_review',
        title: 'New Product Review',
        message: `New review for "${review.product.name}" by ${review.user.firstName} ${review.user.lastName}`,
        data: {
          reviewId: review.id,
          productId: review.product.id,
          productName: review.product.name,
          reviewerName: `${review.user.firstName} ${review.user.lastName}`,
          rating: review.rating,
          title: review.title
        }
      };

      // Send email notifications to admins
      for (const admin of adminUsers) {
        try {
          await emailService.sendNewReviewNotificationEmail(admin.email, {
            id: review.id,
            productName: review.product.name,
            reviewerName: `${review.user.firstName} ${review.user.lastName}`,
            rating: review.rating,
            title: review.title,
            comment: review.comment
          });

          // Store notification in Redis
          await this.storeNotification(admin.id, notificationData);
        } catch (error) {
          logger.error(`Failed to send new review notification to ${admin.email}:`, error);
        }
      }

      logger.info(`New review notification sent for product: ${review.product.name}`);
      return { success: true, recipients: adminUsers.length };
    } catch (error) {
      logger.error('Send new review notification error:', error);
      throw error;
    }
  }

  /**
   * Send order status update notification
   */
  async sendOrderStatusUpdateNotification(orderId, newStatus) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const statusMessages = {
        'processing': 'Your order is being processed',
        'shipped': 'Your order has been shipped',
        'delivered': 'Your order has been delivered',
        'cancelled': 'Your order has been cancelled',
        'refunded': 'Your order has been refunded'
      };

      const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;

      const notificationData = {
        type: 'order_status_update',
        title: 'Order Status Update',
        message: `${message} - Order #${order.orderNumber}`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: newStatus,
          totalAmount: order.totalAmount
        }
      };

      // Send email notification to customer
      try {
        await emailService.sendOrderStatusUpdateEmail(order.user.email, order.user.firstName, {
          id: order.id,
          orderNumber: order.orderNumber,
          status: newStatus,
          totalAmount: order.totalAmount,
          items: order.items || []
        });

        // Store notification in Redis
        await this.storeNotification(order.userId, notificationData);
      } catch (error) {
        logger.error(`Failed to send order status update notification to ${order.user.email}:`, error);
      }

      logger.info(`Order status update notification sent for order: ${order.orderNumber}`);
      return { success: true, recipient: order.user.email };
    } catch (error) {
      logger.error('Send order status update notification error:', error);
      throw error;
    }
  }

  /**
   * Send shipping confirmation notification
   */
  async sendShippingConfirmationNotification(orderId, trackingInfo) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const notificationData = {
        type: 'shipping_confirmation',
        title: 'Order Shipped',
        message: `Your order #${order.orderNumber} has been shipped`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: trackingInfo.trackingNumber,
          shippingCarrier: trackingInfo.shippingCarrier,
          estimatedDelivery: trackingInfo.estimatedDelivery
        }
      };

      // Send email notification to customer
      try {
        await emailService.sendShippingConfirmationEmail(order.user.email, order.user.firstName, {
          id: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: trackingInfo.trackingNumber,
          shippingCarrier: trackingInfo.shippingCarrier,
          estimatedDelivery: trackingInfo.estimatedDelivery,
          items: order.items || []
        });

        // Store notification in Redis
        await this.storeNotification(order.userId, notificationData);
      } catch (error) {
        logger.error(`Failed to send shipping confirmation notification to ${order.user.email}:`, error);
      }

      logger.info(`Shipping confirmation notification sent for order: ${order.orderNumber}`);
      return { success: true, recipient: order.user.email };
    } catch (error) {
      logger.error('Send shipping confirmation notification error:', error);
      throw error;
    }
  }

  /**
   * Send delivery confirmation notification
   */
  async sendDeliveryConfirmationNotification(orderId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] },
          { model: require('../../models').OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] }
        ]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const notificationData = {
        type: 'delivery_confirmation',
        title: 'Order Delivered',
        message: `Your order #${order.orderNumber} has been delivered`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount
        }
      };

      // Send email notification to customer
      try {
        await emailService.sendDeliveryConfirmationEmail(order.user.email, order.user.firstName, {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          items: order.items || []
        });

        // Store notification in Redis
        await this.storeNotification(order.userId, notificationData);
      } catch (error) {
        logger.error(`Failed to send delivery confirmation notification to ${order.user.email}:`, error);
      }

      logger.info(`Delivery confirmation notification sent for order: ${order.orderNumber}`);
      return { success: true, recipient: order.user.email };
    } catch (error) {
      logger.error('Send delivery confirmation notification error:', error);
      throw error;
    }
  }

  /**
   * Send refund confirmation notification
   */
  async sendRefundConfirmationNotification(orderId, refundData) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const notificationData = {
        type: 'refund_confirmation',
        title: 'Refund Processed',
        message: `Refund processed for order #${order.orderNumber}`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundAmount: refundData.refundAmount,
          refundMethod: refundData.refundMethod
        }
      };

      // Send email notification to customer
      try {
        await emailService.sendRefundConfirmationEmail(order.user.email, order.user.firstName, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundAmount: refundData.refundAmount,
          refundMethod: refundData.refundMethod,
          reason: refundData.reason
        });

        // Store notification in Redis
        await this.storeNotification(order.userId, notificationData);
      } catch (error) {
        logger.error(`Failed to send refund confirmation notification to ${order.user.email}:`, error);
      }

      logger.info(`Refund confirmation notification sent for order: ${order.orderNumber}`);
      return { success: true, recipient: order.user.email };
    } catch (error) {
      logger.error('Send refund confirmation notification error:', error);
      throw error;
    }
  }

  /**
   * Send security alert notification
   */
  async sendSecurityAlertNotification(userId, alertData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const notificationData = {
        type: 'security_alert',
        title: 'Security Alert',
        message: alertData.message,
        data: {
          alertType: alertData.type,
          ipAddress: alertData.ipAddress,
          userAgent: alertData.userAgent,
          timestamp: new Date().toISOString()
        }
      };

      // Send email notification to user
      try {
        await emailService.sendSecurityAlertEmail(user.email, user.firstName, {
          type: alertData.type,
          message: alertData.message,
          ipAddress: alertData.ipAddress,
          userAgent: alertData.userAgent,
          timestamp: new Date().toISOString()
        });

        // Store notification in Redis
        await this.storeNotification(userId, notificationData);
      } catch (error) {
        logger.error(`Failed to send security alert notification to ${user.email}:`, error);
      }

      logger.info(`Security alert notification sent for user: ${user.email}`);
      return { success: true, recipient: user.email };
    } catch (error) {
      logger.error('Send security alert notification error:', error);
      throw error;
    }
  }

  /**
   * Store notification in Redis
   */
  async storeNotification(userId, notificationData) {
    try {
      const key = `notifications:${userId}`;
      const notification = {
        id: Date.now().toString(),
        ...notificationData,
        createdAt: new Date().toISOString(),
        read: false
      };

      // Get existing notifications
      const existingNotifications = await redisUtils.get(key) || [];
      const notifications = Array.isArray(existingNotifications) ? existingNotifications : [];

      // Add new notification at the beginning
      notifications.unshift(notification);

      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }

      // Store in Redis with 30 days expiration
      await redisUtils.set(key, notifications, 30 * 24 * 60 * 60);

      logger.info(`Notification stored for user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Store notification error:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const key = `notifications:${userId}`;
      const notifications = await redisUtils.get(key) || [];

      const paginatedNotifications = notifications.slice(offset, offset + limit);
      const total = notifications.length;

      return {
        notifications: paginatedNotifications,
        total,
        hasMore: offset + limit < total
      };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId, notificationId) {
    try {
      const key = `notifications:${userId}`;
      const notifications = await redisUtils.get(key) || [];

      const updatedNotifications = notifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });

      await redisUtils.set(key, updatedNotifications, 30 * 24 * 60 * 60);

      logger.info(`Notification ${notificationId} marked as read for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId) {
    try {
      const key = `notifications:${userId}`;
      const notifications = await redisUtils.get(key) || [];

      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));

      await redisUtils.set(key, updatedNotifications, 30 * 24 * 60 * 60);

      logger.info(`All notifications marked as read for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId, notificationId) {
    try {
      const key = `notifications:${userId}`;
      const notifications = await redisUtils.get(key) || [];

      const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);

      await redisUtils.set(key, updatedNotifications, 30 * 24 * 60 * 60);

      logger.info(`Notification ${notificationId} deleted for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Get notification count
   */
  async getNotificationCount(userId) {
    try {
      const key = `notifications:${userId}`;
      const notifications = await redisUtils.get(key) || [];

      const unreadCount = notifications.filter(notification => !notification.read).length;

      return {
        total: notifications.length,
        unread: unreadCount
      };
    } catch (error) {
      logger.error('Get notification count error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
