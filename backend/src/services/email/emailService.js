const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../../utils/logger/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Initialize email transporter
   */
  async initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization error:', error);
      throw error;
    }
  }

  /**
   * Load email templates
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, 'templates');
      const templateFiles = await fs.readdir(templatesDir);

      for (const file of templateFiles) {
        if (file.endsWith('.hbs')) {
          const templateName = path.basename(file, '.hbs');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          const compiledTemplate = handlebars.compile(templateContent);
          this.templates.set(templateName, compiledTemplate);
        }
      }

      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Template loading error:', error);
      // Don't throw error as templates might not exist yet
    }
  }

  /**
   * Send email with template
   */
  async sendEmail({ to, subject, template, data = {}, attachments = [] }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Get template
      const templateFn = this.templates.get(template);
      if (!templateFn) {
        throw new Error(`Template '${template}' not found`);
      }

      // Compile template with data
      const html = templateFn(data);

      // Create email options
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        attachments
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
      return result;
    } catch (error) {
      logger.error('Send email error:', error);
      throw error;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email, token, firstName) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: 'emailVerification',
      data: {
        firstName,
        verificationUrl,
        expiresIn: '24 hours',
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: 'passwordReset',
      data: {
        firstName,
        resetUrl,
        expiresIn: '1 hour',
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, firstName) {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to GameStore!',
      template: 'welcome',
      data: {
        firstName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(email, firstName, orderData) {
    await this.sendEmail({
      to: email,
      subject: `Order Confirmation - #${orderData.orderNumber}`,
      template: 'orderConfirmation',
      data: {
        firstName,
        order: orderData,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${orderData.id}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdateEmail(email, firstName, orderData) {
    await this.sendEmail({
      to: email,
      subject: `Order Status Update - #${orderData.orderNumber}`,
      template: 'orderStatusUpdate',
      data: {
        firstName,
        order: orderData,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${orderData.id}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send shipping confirmation email
   */
  async sendShippingConfirmationEmail(email, firstName, orderData) {
    await this.sendEmail({
      to: email,
      subject: `Your Order Has Been Shipped - #${orderData.orderNumber}`,
      template: 'shippingConfirmation',
      data: {
        firstName,
        order: orderData,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${orderData.id}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send delivery confirmation email
   */
  async sendDeliveryConfirmationEmail(email, firstName, orderData) {
    await this.sendEmail({
      to: email,
      subject: `Your Order Has Been Delivered - #${orderData.orderNumber}`,
      template: 'deliveryConfirmation',
      data: {
        firstName,
        order: orderData,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${orderData.id}`,
        reviewUrl: `${process.env.FRONTEND_URL}/products/${orderData.items[0]?.productId}/review`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send refund confirmation email
   */
  async sendRefundConfirmationEmail(email, firstName, refundData) {
    await this.sendEmail({
      to: email,
      subject: `Refund Processed - #${refundData.orderNumber}`,
      template: 'refundConfirmation',
      data: {
        firstName,
        refund: refundData,
        orderUrl: `${process.env.FRONTEND_URL}/orders/${refundData.orderId}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send low stock alert email (admin)
   */
  async sendLowStockAlertEmail(email, productData) {
    await this.sendEmail({
      to: email,
      subject: 'Low Stock Alert',
      template: 'lowStockAlert',
      data: {
        product: productData,
        productUrl: `${process.env.FRONTEND_URL}/admin/products/${productData.id}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send out of stock alert email (admin)
   */
  async sendOutOfStockAlertEmail(email, productData) {
    await this.sendEmail({
      to: email,
      subject: 'Out of Stock Alert',
      template: 'outOfStockAlert',
      data: {
        product: productData,
        productUrl: `${process.env.FRONTEND_URL}/admin/products/${productData.id}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send new review notification email (admin)
   */
  async sendNewReviewNotificationEmail(email, reviewData) {
    await this.sendEmail({
      to: email,
      subject: 'New Product Review',
      template: 'newReviewNotification',
      data: {
        review: reviewData,
        reviewUrl: `${process.env.FRONTEND_URL}/admin/reviews/${reviewData.id}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send account deactivation email
   */
  async sendAccountDeactivationEmail(email, firstName) {
    await this.sendEmail({
      to: email,
      subject: 'Account Deactivated',
      template: 'accountDeactivation',
      data: {
        firstName,
        reactivationUrl: `${process.env.FRONTEND_URL}/contact-support`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send account reactivation email
   */
  async sendAccountReactivationEmail(email, firstName) {
    await this.sendEmail({
      to: email,
      subject: 'Account Reactivated',
      template: 'accountReactivation',
      data: {
        firstName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(email, firstName, alertData) {
    await this.sendEmail({
      to: email,
      subject: 'Security Alert',
      template: 'securityAlert',
      data: {
        firstName,
        alert: alertData,
        accountUrl: `${process.env.FRONTEND_URL}/profile/security`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send newsletter email
   */
  async sendNewsletterEmail(email, firstName, newsletterData) {
    await this.sendEmail({
      to: email,
      subject: newsletterData.subject,
      template: 'newsletter',
      data: {
        firstName,
        newsletter: newsletterData,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send promotional email
   */
  async sendPromotionalEmail(email, firstName, promoData) {
    await this.sendEmail({
      to: email,
      subject: promoData.subject,
      template: 'promotional',
      data: {
        firstName,
        promo: promoData,
        unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
        supportEmail: process.env.SUPPORT_EMAIL
      }
    });
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(recipients, subject, template, data = {}) {
    try {
      const results = [];
      const batchSize = 50; // Send in batches to avoid overwhelming the server

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(recipient => 
          this.sendEmail({
            to: recipient.email,
            subject,
            template,
            data: { ...data, firstName: recipient.firstName }
          }).catch(error => ({
            email: recipient.email,
            error: error.message
          }))
        );

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Add delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Bulk email sent: ${successful} successful, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      logger.error('Bulk email error:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      const testEmail = process.env.TEST_EMAIL || process.env.SMTP_USER;
      if (!testEmail) {
        throw new Error('No test email address configured');
      }

      await this.sendEmail({
        to: testEmail,
        subject: 'Email Service Test',
        template: 'test',
        data: {
          message: 'This is a test email to verify the email service configuration.',
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Email service test successful');
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      logger.error('Email service test failed:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats() {
    try {
      // This would typically query a database table that logs email sends
      // For now, return basic stats
      return {
        totalSent: 0,
        successful: 0,
        failed: 0,
        lastSent: null,
        templates: Array.from(this.templates.keys())
      };
    } catch (error) {
      logger.error('Get email stats error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
