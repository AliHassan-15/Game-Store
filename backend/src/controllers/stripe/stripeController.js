const { stripeUtils, stripeClient } = require('../../config/stripe');
const { User, UserPayment, Order } = require('../../models');
const logger = require('../../utils/logger/logger');

class StripeController {

  async createPaymentIntent(req, res) {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      // Get user for metadata
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add user info to metadata
      const paymentMetadata = {
        userId: userId,
        userEmail: user.email,
        ...metadata
      };

      // Create payment intent
      const result = await stripeUtils.createPaymentIntent(
        amount,
        currency,
        paymentMetadata
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create payment intent',
          error: result.error
        });
      }

      logger.info(`Payment intent created: ${result.paymentIntentId}, Amount: ${amount}, User: ${userId}`);

      res.json({
        success: true,
        message: 'Payment intent created successfully',
        data: {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId
        }
      });

    } catch (error) {
      logger.error('Create payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Confirm payment intent
   * POST /api/v1/stripe/confirm-payment
   */
  async confirmPayment(req, res) {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.id;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required'
        });
      }

      // Confirm payment intent
      const result = await stripeUtils.confirmPaymentIntent(paymentIntentId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Payment confirmation failed',
          error: result.error
        });
      }

      logger.info(`Payment confirmed: ${paymentIntentId}, User: ${userId}`);

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          status: result.status,
          amount: result.amount,
          currency: result.currency
        }
      });

    } catch (error) {
      logger.error('Confirm payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get payment intent details
   * GET /api/v1/stripe/payment-intent/:paymentIntentId
   */
  async getPaymentIntent(req, res) {
    try {
      const { paymentIntentId } = req.params;

      const result = await stripeUtils.getPaymentIntent(paymentIntentId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Payment intent not found',
          error: result.error
        });
      }

      res.json({
        success: true,
        data: {
          paymentIntent: {
            id: result.paymentIntent.id,
            amount: result.paymentIntent.amount,
            currency: result.paymentIntent.currency,
            status: result.paymentIntent.status,
            created: result.paymentIntent.created,
            metadata: result.paymentIntent.metadata
          }
        }
      });

    } catch (error) {
      logger.error('Get payment intent error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment intent',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create customer
   * POST /api/v1/stripe/customers
   */
  async createCustomer(req, res) {
    try {
      const { email, name, metadata = {} } = req.body;
      const userId = req.user.id;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Add user ID to metadata
      const customerMetadata = {
        userId: userId,
        ...metadata
      };

      const result = await stripeUtils.createCustomer(email, name, customerMetadata);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create customer',
          error: result.error
        });
      }

      // Update user with Stripe customer ID
      await User.update(
        { stripeCustomerId: result.customerId },
        { where: { id: userId } }
      );

      logger.info(`Stripe customer created: ${result.customerId}, User: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: {
          customerId: result.customerId,
          customer: {
            id: result.customer.id,
            email: result.customer.email,
            name: result.customer.name
          }
        }
      });

    } catch (error) {
      logger.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create payment method
   * POST /api/v1/stripe/payment-methods
   */
  async createPaymentMethod(req, res) {
    try {
      const { type, card, billingDetails } = req.body;
      const userId = req.user.id;

      if (!type || !card) {
        return res.status(400).json({
          success: false,
          message: 'Payment method type and card details are required'
        });
      }

      const result = await stripeUtils.createPaymentMethod(type, card, billingDetails);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create payment method',
          error: result.error
        });
      }

      // Save payment method to user's account
      const paymentMethod = result.paymentMethod;
      await UserPayment.create({
        userId,
        type: paymentMethod.type,
        cardType: paymentMethod.card?.brand || null,
        last4: paymentMethod.card?.last4 || null,
        expiryMonth: paymentMethod.card?.exp_month || null,
        expiryYear: paymentMethod.card?.exp_year || null,
        cardholderName: billingDetails?.name || null,
        stripePaymentMethodId: paymentMethod.id,
        isDefault: false
      });

      logger.info(`Payment method created: ${result.paymentMethodId}, User: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Payment method created successfully',
        data: {
          paymentMethodId: result.paymentMethodId,
          paymentMethod: {
            id: paymentMethod.id,
            type: paymentMethod.type,
            card: paymentMethod.card ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year
            } : null
          }
        }
      });

    } catch (error) {
      logger.error('Create payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment method',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Attach payment method to customer
   * POST /api/v1/stripe/payment-methods/:paymentMethodId/attach
   */
  async attachPaymentMethod(req, res) {
    try {
      const { paymentMethodId } = req.params;
      const userId = req.user.id;

      // Get user's Stripe customer ID
      const user = await User.findByPk(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({
          success: false,
          message: 'User does not have a Stripe customer account'
        });
      }

      const result = await stripeUtils.attachPaymentMethod(paymentMethodId, user.stripeCustomerId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to attach payment method',
          error: result.error
        });
      }

      logger.info(`Payment method attached: ${paymentMethodId} to customer: ${user.stripeCustomerId}`);

      res.json({
        success: true,
        message: 'Payment method attached successfully',
        data: {
          paymentMethodId: paymentMethodId,
          customerId: user.stripeCustomerId
        }
      });

    } catch (error) {
      logger.error('Attach payment method error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to attach payment method',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Process refund
   * POST /api/v1/stripe/refunds
   */
  async createRefund(req, res) {
    try {
      const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;
      const userId = req.user.id;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required'
        });
      }

      // Verify user owns the order
      const order = await Order.findOne({
        where: { paymentIntentId, userId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const result = await stripeUtils.createRefund(paymentIntentId, amount || order.total, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to create refund',
          error: result.error
        });
      }

      logger.info(`Refund created: ${result.refundId} for payment: ${paymentIntentId}, User: ${userId}`);

      res.json({
        success: true,
        message: 'Refund created successfully',
        data: {
          refundId: result.refundId,
          amount: amount || order.total,
          reason: reason
        }
      });

    } catch (error) {
      logger.error('Create refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create refund',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Handle Stripe webhooks
   * POST /api/v1/stripe/webhooks
   */
  async handleWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return res.status(400).json({
          success: false,
          message: 'Missing webhook signature or secret'
        });
      }

      // Verify webhook signature
      const result = stripeUtils.verifyWebhookSignature(req.body, sig, webhookSecret);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
          error: result.error
        });
      }

      const event = result.event;

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: 'Webhook error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Handle payment intent succeeded
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      logger.info(`Payment succeeded: ${paymentIntent.id}, Amount: ${paymentIntent.amount}`);

      // Update order status if exists
      const order = await Order.findOne({
        where: { paymentIntentId: paymentIntent.id }
      });

      if (order) {
        await order.update({
          status: 'paid',
          paidAt: new Date()
        });

        logger.info(`Order updated to paid: ${order.orderNumber}`);
      }

    } catch (error) {
      logger.error('Handle payment intent succeeded error:', error);
    }
  }

  /**
   * Handle payment intent failed
   */
  async handlePaymentIntentFailed(paymentIntent) {
    try {
      logger.info(`Payment failed: ${paymentIntent.id}, Amount: ${paymentIntent.amount}`);

      // Update order status if exists
      const order = await Order.findOne({
        where: { paymentIntentId: paymentIntent.id }
      });

      if (order) {
        await order.update({
          status: 'payment_failed'
        });

        logger.info(`Order updated to payment failed: ${order.orderNumber}`);
      }

    } catch (error) {
      logger.error('Handle payment intent failed error:', error);
    }
  }

  /**
   * Handle charge refunded
   */
  async handleChargeRefunded(charge) {
    try {
      logger.info(`Charge refunded: ${charge.id}, Amount: ${charge.amount}`);

      // Update order status if exists
      const order = await Order.findOne({
        where: { paymentIntentId: charge.payment_intent }
      });

      if (order) {
        await order.update({
          status: 'refunded',
          refundedAt: new Date()
        });

        logger.info(`Order updated to refunded: ${order.orderNumber}`);
      }

    } catch (error) {
      logger.error('Handle charge refunded error:', error);
    }
  }

  /**
   * Handle subscription created
   */
  async handleSubscriptionCreated(subscription) {
    try {
      logger.info(`Subscription created: ${subscription.id}, Customer: ${subscription.customer}`);
      // Add subscription handling logic here
    } catch (error) {
      logger.error('Handle subscription created error:', error);
    }
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(subscription) {
    try {
      logger.info(`Subscription updated: ${subscription.id}, Status: ${subscription.status}`);
      // Add subscription handling logic here
    } catch (error) {
      logger.error('Handle subscription updated error:', error);
    }
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      logger.info(`Subscription deleted: ${subscription.id}, Customer: ${subscription.customer}`);
      // Add subscription handling logic here
    } catch (error) {
      logger.error('Handle subscription deleted error:', error);
    }
  }

  /**
   * Get Stripe configuration
   * GET /api/v1/stripe/config
   */
  async getStripeConfig(req, res) {
    try {
      const publishableKey = stripeUtils.getPublishableKey();

      res.json({
        success: true,
        data: {
          publishableKey,
          currency: 'usd',
          supportedPaymentMethods: ['card']
        }
      });

    } catch (error) {
      logger.error('Get Stripe config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Stripe configuration',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new StripeController();
