const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, User, OrderItem, Product } = require('../../models');
const logger = require('../../utils/logger/logger');

class PaymentService {
  /**
   * Create payment intent
   */
  async createPaymentIntent(orderId, paymentMethodId = null) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] }
        ]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.paymentStatus === 'paid') {
        throw new Error('Order is already paid');
      }

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(order.totalAmount * 100);

      const paymentIntentData = {
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          orderId: order.id.toString(),
          orderNumber: order.orderNumber,
          userId: order.userId.toString()
        },
        description: `Payment for order #${order.orderNumber}`,
        receipt_email: order.user.email
      };

      // If payment method is provided, attach it
      if (paymentMethodId) {
        paymentIntentData.payment_method = paymentMethodId;
        paymentIntentData.confirm = true;
        paymentIntentData.return_url = `${process.env.FRONTEND_URL}/orders/${order.id}/confirmation`;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Update order with payment intent ID
      await order.update({
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: 'pending'
      });

      logger.info(`Payment intent created for order ${order.orderNumber}: ${paymentIntent.id}`);
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethodId = null) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        throw new Error('Payment intent is already succeeded');
      }

      const confirmData = {};
      if (paymentMethodId) {
        confirmData.payment_method = paymentMethodId;
      }

      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, confirmData);

      // Update order status if payment is successful
      if (confirmedPaymentIntent.status === 'succeeded') {
        const order = await Order.findOne({
          where: { stripePaymentIntentId: paymentIntentId }
        });

        if (order) {
          await order.update({
            paymentStatus: 'paid',
            status: 'processing',
            paidAt: new Date()
          });

          logger.info(`Payment confirmed for order ${order.orderNumber}`);
        }
      }

      return {
        status: confirmedPaymentIntent.status,
        amount: confirmedPaymentIntent.amount / 100,
        currency: confirmedPaymentIntent.currency,
        paymentMethod: confirmedPaymentIntent.payment_method
      };
    } catch (error) {
      logger.error('Confirm payment intent error:', error);
      throw error;
    }
  }

  /**
   * Process payment with saved payment method
   */
  async processPaymentWithSavedMethod(orderId, paymentMethodId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'email', 'stripeCustomerId'] }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.user.stripeCustomerId) {
        throw new Error('Customer does not have a Stripe account');
      }

      // Convert amount to cents
      const amountInCents = Math.round(order.totalAmount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: order.user.stripeCustomerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        metadata: {
          orderId: order.id.toString(),
          orderNumber: order.orderNumber,
          userId: order.userId.toString()
        },
        description: `Payment for order #${order.orderNumber}`,
        receipt_email: order.user.email
      });

      // Update order
      await order.update({
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: paymentIntent.status === 'succeeded' ? 'paid' : 'failed',
        status: paymentIntent.status === 'succeeded' ? 'processing' : order.status,
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null
      });

      logger.info(`Payment processed with saved method for order ${order.orderNumber}: ${paymentIntent.status}`);
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      logger.error('Process payment with saved method error:', error);
      throw error;
    }
  }

  /**
   * Create customer
   */
  async createCustomer(userData) {
    try {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone,
        metadata: {
          userId: userData.id.toString()
        }
      });

      // Update user with Stripe customer ID
      await User.update(
        { stripeCustomerId: customer.id },
        { where: { id: userData.id } }
      );

      logger.info(`Stripe customer created for user ${userData.email}: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Create customer error:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId, updateData) {
    try {
      const customer = await stripe.customers.update(customerId, updateData);
      logger.info(`Stripe customer updated: ${customerId}`);
      return customer;
    } catch (error) {
      logger.error('Update customer error:', error);
      throw error;
    }
  }

  /**
   * Create payment method
   */
  async createPaymentMethod(paymentMethodData) {
    try {
      const paymentMethod = await stripe.paymentMethods.create(paymentMethodData);
      logger.info(`Payment method created: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Create payment method error:', error);
      throw error;
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      logger.info(`Payment method ${paymentMethodId} attached to customer ${customerId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Attach payment method error:', error);
      throw error;
    }
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      logger.info(`Payment method detached: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Detach payment method error:', error);
      throw error;
    }
  }

  /**
   * List customer payment methods
   */
  async listCustomerPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: type
      });
      return paymentMethods.data;
    } catch (error) {
      logger.error('List customer payment methods error:', error);
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId, refundData) {
    try {
      const refundOptions = {
        payment_intent: paymentIntentId,
        amount: refundData.amount ? Math.round(refundData.amount * 100) : undefined,
        reason: refundData.reason || 'requested_by_customer',
        metadata: {
          orderId: refundData.orderId?.toString(),
          orderNumber: refundData.orderNumber,
          refundReason: refundData.refundReason
        }
      };

      const refund = await stripe.refunds.create(refundOptions);

      // Update order status if full refund
      if (refundData.amount === refundData.orderAmount) {
        const order = await Order.findOne({
          where: { stripePaymentIntentId: paymentIntentId }
        });

        if (order) {
          await order.update({
            status: 'refunded',
            refundedAt: new Date()
          });
        }
      }

      logger.info(`Refund created: ${refund.id} for payment intent ${paymentIntentId}`);
      return {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason
      };
    } catch (error) {
      logger.error('Create refund error:', error);
      throw error;
    }
  }

  /**
   * Get refund details
   */
  async getRefund(refundId) {
    try {
      const refund = await stripe.refunds.retrieve(refundId);
      return {
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: refund.created
      };
    } catch (error) {
      logger.error('Get refund error:', error);
      throw error;
    }
  }

  /**
   * List refunds
   */
  async listRefunds(paymentIntentId = null, limit = 10) {
    try {
      const options = { limit };
      if (paymentIntentId) {
        options.payment_intent = paymentIntentId;
      }

      const refunds = await stripe.refunds.list(options);
      return refunds.data.map(refund => ({
        id: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: refund.created
      }));
    } catch (error) {
      logger.error('List refunds error:', error);
      throw error;
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId, cancellationReason = 'requested_by_customer') {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: cancellationReason
      });

      // Update order status
      const order = await Order.findOne({
        where: { stripePaymentIntentId: paymentIntentId }
      });

      if (order) {
        await order.update({
          paymentStatus: 'cancelled',
          status: 'cancelled',
          cancelledAt: new Date()
        });
      }

      logger.info(`Payment intent cancelled: ${paymentIntentId}`);
      return {
        status: paymentIntent.status,
        cancellationReason: paymentIntent.cancellation_reason
      };
    } catch (error) {
      logger.error('Cancel payment intent error:', error);
      throw error;
    }
  }

  /**
   * Capture payment intent
   */
  async capturePaymentIntent(paymentIntentId, captureData = {}) {
    try {
      const captureOptions = {};
      if (captureData.amount) {
        captureOptions.amount_to_capture = Math.round(captureData.amount * 100);
      }

      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId, captureOptions);

      // Update order status
      const order = await Order.findOne({
        where: { stripePaymentIntentId: paymentIntentId }
      });

      if (order && paymentIntent.status === 'succeeded') {
        await order.update({
          paymentStatus: 'paid',
          status: 'processing',
          paidAt: new Date()
        });
      }

      logger.info(`Payment intent captured: ${paymentIntentId}`);
      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        amountCaptured: paymentIntent.amount_captured / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      logger.error('Capture payment intent error:', error);
      throw error;
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        amountCaptured: paymentIntent.amount_captured / 100,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        customer: paymentIntent.customer,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created
      };
    } catch (error) {
      logger.error('Get payment intent error:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Handle webhook event error:', error);
      throw error;
    }
  }

  /**
   * Handle payment intent succeeded
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const order = await Order.findOne({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (order) {
        await order.update({
          paymentStatus: 'paid',
          status: 'processing',
          paidAt: new Date()
        });

        logger.info(`Order ${order.orderNumber} payment succeeded`);
      }
    } catch (error) {
      logger.error('Handle payment intent succeeded error:', error);
      throw error;
    }
  }

  /**
   * Handle payment intent failed
   */
  async handlePaymentIntentFailed(paymentIntent) {
    try {
      const order = await Order.findOne({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (order) {
        await order.update({
          paymentStatus: 'failed',
          status: 'pending'
        });

        logger.info(`Order ${order.orderNumber} payment failed`);
      }
    } catch (error) {
      logger.error('Handle payment intent failed error:', error);
      throw error;
    }
  }

  /**
   * Handle payment intent canceled
   */
  async handlePaymentIntentCanceled(paymentIntent) {
    try {
      const order = await Order.findOne({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (order) {
        await order.update({
          paymentStatus: 'cancelled',
          status: 'cancelled',
          cancelledAt: new Date()
        });

        logger.info(`Order ${order.orderNumber} payment canceled`);
      }
    } catch (error) {
      logger.error('Handle payment intent canceled error:', error);
      throw error;
    }
  }

  /**
   * Handle charge refunded
   */
  async handleChargeRefunded(charge) {
    try {
      const order = await Order.findOne({
        where: { stripePaymentIntentId: charge.payment_intent }
      });

      if (order) {
        await order.update({
          status: 'refunded',
          refundedAt: new Date()
        });

        logger.info(`Order ${order.orderNumber} refunded`);
      }
    } catch (error) {
      logger.error('Handle charge refunded error:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(startDate, endDate) {
    try {
      const payments = await stripe.paymentIntents.list({
        created: {
          gte: Math.floor(new Date(startDate).getTime() / 1000),
          lte: Math.floor(new Date(endDate).getTime() / 1000)
        },
        limit: 100
      });

      const stats = {
        total: 0,
        successful: 0,
        failed: 0,
        canceled: 0,
        totalAmount: 0,
        successfulAmount: 0
      };

      payments.data.forEach(payment => {
        stats.total++;
        stats.totalAmount += payment.amount / 100;

        if (payment.status === 'succeeded') {
          stats.successful++;
          stats.successfulAmount += payment.amount / 100;
        } else if (payment.status === 'canceled') {
          stats.canceled++;
        } else {
          stats.failed++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Get payment stats error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
