const stripe = require('stripe');
const logger = require('../utils/logger/logger');

// Stripe configuration with camelCase variables
const stripeConfig = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
};

// Initialize Stripe with secret key
const stripeClient = stripe(stripeConfig.stripeSecretKey);

// Stripe configuration and utilities
const stripeUtils = {
  // Get publishable key for frontend
  getPublishableKey: () => {
    return stripeConfig.stripePublishableKey;
  },

  // Create payment intent
  createPaymentIntent: async (amount, currency = 'usd', metadata = {}) => {
    try {
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      logger.info(`Payment intent created: ${paymentIntent.id}`);
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Confirm payment intent
  confirmPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        logger.info(`Payment confirmed: ${paymentIntentId}`);
        return {
          success: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency
        };
      } else {
        return {
          success: false,
          status: paymentIntent.status,
          error: `Payment not completed. Status: ${paymentIntent.status}`
        };
      }
    } catch (error) {
      logger.error('Stripe payment confirmation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Create customer
  createCustomer: async (email, name, metadata = {}) => {
    try {
      const customer = await stripeClient.customers.create({
        email: email,
        name: name,
        metadata: metadata
      });
      
      logger.info(`Customer created: ${customer.id}`);
      return {
        success: true,
        customerId: customer.id,
        customer: customer
      };
    } catch (error) {
      logger.error('Stripe customer creation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Create payment method
  createPaymentMethod: async (type, card, billingDetails) => {
    try {
      const paymentMethod = await stripeClient.paymentMethods.create({
        type: type,
        card: card,
        billing_details: billingDetails
      });
      
      logger.info(`Payment method created: ${paymentMethod.id}`);
      return {
        success: true,
        paymentMethodId: paymentMethod.id,
        paymentMethod: paymentMethod
      };
    } catch (error) {
      logger.error('Stripe payment method creation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Attach payment method to customer
  attachPaymentMethod: async (paymentMethodId, customerId) => {
    try {
      const paymentMethod = await stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      
      logger.info(`Payment method attached: ${paymentMethodId} to customer: ${customerId}`);
      return {
        success: true,
        paymentMethod: paymentMethod
      };
    } catch (error) {
      logger.error('Stripe payment method attachment failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Refund payment
  createRefund: async (paymentIntentId, amount, reason = 'requested_by_customer') => {
    try {
      const refund = await stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason
      });
      
      logger.info(`Refund created: ${refund.id} for payment: ${paymentIntentId}`);
      return {
        success: true,
        refundId: refund.id,
        refund: refund
      };
    } catch (error) {
      logger.error('Stripe refund creation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get payment intent details
  getPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent: paymentIntent
      };
    } catch (error) {
      logger.error('Stripe get payment intent failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Verify webhook signature
  verifyWebhookSignature: (payload, signature, secret) => {
    try {
      const event = stripeClient.webhooks.constructEvent(payload, signature, secret);
      return {
        success: true,
        event: event
      };
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Format amount for display
  formatAmount: (amount, currency = 'usd') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(amount / 100); // Convert from cents
  },

  // Convert amount to cents
  convertToCents: (amount) => {
    return Math.round(amount * 100);
  },

  // Convert cents to amount
  convertFromCents: (cents) => {
    return cents / 100;
  }
};

// Test Stripe connection
const testStripeConnection = async () => {
  try {
    // Test by creating a test payment intent
    const testIntent = await stripeClient.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      metadata: { test: true }
    });
    
    // Immediately cancel it
    await stripeClient.paymentIntents.cancel(testIntent.id);
    
    logger.info('Stripe connection test successful');
    return true;
  } catch (error) {
    logger.error('Stripe connection test failed:', error.message);
    return false;
  }
};

module.exports = {
  stripeClient,
  stripeConfig,
  stripeUtils,
  testStripeConnection
};
