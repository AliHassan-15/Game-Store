const { User, UserAddress, UserPayment, Order, Review, ActivityLog } = require('../../models');
const logger = require('../../utils/logger/logger');
class UserController {
  
  async getUserProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserAddress,
            as: 'addresses',
            where: { isActive: true },
            required: false
          },
          {
            model: UserPayment,
            as: 'payments',
            where: { isActive: true },
            required: false
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            addresses: user.addresses || [],
            payments: user.payments || []
          }
        }
      });

    } catch (error) {
      logger.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/users/profile
   */
  async updateUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, avatar } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user profile
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        avatar: avatar || user.avatar
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_profile_update',
        'User profile updated',
        { 
          updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined)
        }
      );

      logger.info(`User profile updated: ${user.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            updatedAt: user.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user addresses
   * GET /api/v1/users/addresses
   */
  async getUserAddresses(req, res) {
    try {
      const userId = req.user.id;

      const addresses = await UserAddress.findAll({
        where: { userId, isActive: true },
        order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          addresses: addresses.map(address => ({
            id: address.id,
            type: address.type,
            firstName: address.firstName,
            lastName: address.lastName,
            company: address.company,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
            isDefault: address.isDefault,
            createdAt: address.createdAt
          }))
        }
      });

    } catch (error) {
      logger.error('Get user addresses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get addresses',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add user address
   * POST /api/v1/users/addresses
   */
  async addUserAddress(req, res) {
    try {
      const userId = req.user.id;
      const {
        type,
        firstName,
        lastName,
        company,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault = false
      } = req.body;

      // Validate required fields
      if (!type || !firstName || !lastName || !addressLine1 || !city || !state || !postalCode || !country) {
        return res.status(400).json({
          success: false,
          message: 'Required address fields are missing'
        });
      }

      // If this is set as default, unset other defaults of the same type
      if (isDefault) {
        await UserAddress.update(
          { isDefault: false },
          { where: { userId, type, isDefault: true } }
        );
      }

      // Create address
      const address = await UserAddress.create({
        userId,
        type,
        firstName,
        lastName,
        company,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_address_add',
        'User address added',
        { 
          addressType: type,
          city,
          state,
          country
        }
      );

      logger.info(`User address added: ${userId}, Type: ${type}`);

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: {
          address: {
            id: address.id,
            type: address.type,
            firstName: address.firstName,
            lastName: address.lastName,
            company: address.company,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
            isDefault: address.isDefault,
            createdAt: address.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Add user address error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add address',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update user address
   * PUT /api/v1/users/addresses/:id
   */
  async updateUserAddress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const {
        type,
        firstName,
        lastName,
        company,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault
      } = req.body;

      const address = await UserAddress.findOne({
        where: { id, userId, isActive: true }
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // If setting as default, unset other defaults of the same type
      if (isDefault && !address.isDefault) {
        await UserAddress.update(
          { isDefault: false },
          { where: { userId, type: address.type, isDefault: true } }
        );
      }

      // Update address
      await address.update({
        type: type || address.type,
        firstName: firstName || address.firstName,
        lastName: lastName || address.lastName,
        company: company !== undefined ? company : address.company,
        addressLine1: addressLine1 || address.addressLine1,
        addressLine2: addressLine2 !== undefined ? addressLine2 : address.addressLine2,
        city: city || address.city,
        state: state || address.state,
        postalCode: postalCode || address.postalCode,
        country: country || address.country,
        phone: phone !== undefined ? phone : address.phone,
        isDefault: isDefault !== undefined ? isDefault : address.isDefault
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_address_update',
        'User address updated',
        { 
          addressId: address.id,
          addressType: address.type
        }
      );

      logger.info(`User address updated: ${userId}, Address ID: ${id}`);

      res.json({
        success: true,
        message: 'Address updated successfully',
        data: {
          address: {
            id: address.id,
            type: address.type,
            firstName: address.firstName,
            lastName: address.lastName,
            company: address.company,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phone: address.phone,
            isDefault: address.isDefault,
            updatedAt: address.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update user address error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update address',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete user address
   * DELETE /api/v1/users/addresses/:id
   */
  async deleteUserAddress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const address = await UserAddress.findOne({
        where: { id, userId, isActive: true }
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }

      // Soft delete address
      await address.update({ isActive: false });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_address_delete',
        'User address deleted',
        { 
          addressId: address.id,
          addressType: address.type
        }
      );

      logger.info(`User address deleted: ${userId}, Address ID: ${id}`);

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });

    } catch (error) {
      logger.error('Delete user address error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete address',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user payment methods
   * GET /api/v1/users/payments
   */
  async getUserPayments(req, res) {
    try {
      const userId = req.user.id;

      const payments = await UserPayment.findAll({
        where: { userId, isActive: true },
        order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          payments: payments.map(payment => ({
            id: payment.id,
            type: payment.type,
            cardType: payment.cardType,
            last4: payment.last4,
            expiryMonth: payment.expiryMonth,
            expiryYear: payment.expiryYear,
            cardholderName: payment.cardholderName,
            isDefault: payment.isDefault,
            createdAt: payment.createdAt
          }))
        }
      });

    } catch (error) {
      logger.error('Get user payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment methods',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add user payment method
   * POST /api/v1/users/payments
   */
  async addUserPayment(req, res) {
    try {
      const userId = req.user.id;
      const {
        type,
        cardType,
        last4,
        expiryMonth,
        expiryYear,
        cardholderName,
        isDefault = false
      } = req.body;

      // Validate required fields
      if (!type || !cardType || !last4 || !expiryMonth || !expiryYear || !cardholderName) {
        return res.status(400).json({
          success: false,
          message: 'Required payment method fields are missing'
        });
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        await UserPayment.update(
          { isDefault: false },
          { where: { userId, isDefault: true } }
        );
      }

      // Create payment method
      const payment = await UserPayment.create({
        userId,
        type,
        cardType,
        last4,
        expiryMonth,
        expiryYear,
        cardholderName,
        isDefault
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_payment_add',
        'User payment method added',
        { 
          paymentType: type,
          cardType,
          last4
        }
      );

      logger.info(`User payment method added: ${userId}, Type: ${type}, Last4: ${last4}`);

      res.status(201).json({
        success: true,
        message: 'Payment method added successfully',
        data: {
          payment: {
            id: payment.id,
            type: payment.type,
            cardType: payment.cardType,
            last4: payment.last4,
            expiryMonth: payment.expiryMonth,
            expiryYear: payment.expiryYear,
            cardholderName: payment.cardholderName,
            isDefault: payment.isDefault,
            createdAt: payment.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Add user payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add payment method',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update user payment method
   * PUT /api/v1/users/payments/:id
   */
  async updateUserPayment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const {
        cardholderName,
        isDefault
      } = req.body;

      const payment = await UserPayment.findOne({
        where: { id, userId, isActive: true }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      // If setting as default, unset other defaults
      if (isDefault && !payment.isDefault) {
        await UserPayment.update(
          { isDefault: false },
          { where: { userId, isDefault: true } }
        );
      }

      // Update payment method
      await payment.update({
        cardholderName: cardholderName || payment.cardholderName,
        isDefault: isDefault !== undefined ? isDefault : payment.isDefault
      });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_payment_update',
        'User payment method updated',
        { 
          paymentId: payment.id,
          paymentType: payment.type
        }
      );

      logger.info(`User payment method updated: ${userId}, Payment ID: ${id}`);

      res.json({
        success: true,
        message: 'Payment method updated successfully',
        data: {
          payment: {
            id: payment.id,
            type: payment.type,
            cardType: payment.cardType,
            last4: payment.last4,
            expiryMonth: payment.expiryMonth,
            expiryYear: payment.expiryYear,
            cardholderName: payment.cardholderName,
            isDefault: payment.isDefault,
            updatedAt: payment.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update user payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment method',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete user payment method
   * DELETE /api/v1/users/payments/:id
   */
  async deleteUserPayment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const payment = await UserPayment.findOne({
        where: { id, userId, isActive: true }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment method not found'
        });
      }

      // Soft delete payment method
      await payment.update({ isActive: false });

      // Log activity
      await ActivityLog.createUserActivity(
        userId,
        'user_payment_delete',
        'User payment method deleted',
        { 
          paymentId: payment.id,
          paymentType: payment.type
        }
      );

      logger.info(`User payment method deleted: ${userId}, Payment ID: ${id}`);

      res.json({
        success: true,
        message: 'Payment method deleted successfully'
      });

    } catch (error) {
      logger.error('Delete user payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete payment method',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get user statistics
   * GET /api/v1/users/statistics
   */
  async getUserStatistics(req, res) {
    try {
      const userId = req.user.id;

      // Get user statistics
      const [
        totalOrders,
        totalReviews,
        totalSpent,
        favoriteCategories
      ] = await Promise.all([
        Order.count({ where: { userId } }),
        Review.count({ where: { userId } }),
        Order.sum('total', { where: { userId, status: 'paid' } }),
        Order.findAll({
          attributes: [
            'id',
            [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
          ],
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              include: [
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
              ]
            }
          ],
          where: { userId },
          group: ['product.categoryId', 'product.category.id', 'product.category.name'],
          order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
          limit: 5
        })
      ]);

      res.json({
        success: true,
        data: {
          statistics: {
            totalOrders: totalOrders || 0,
            totalReviews: totalReviews || 0,
            totalSpent: parseFloat(totalSpent || 0).toFixed(2),
            favoriteCategories: favoriteCategories.map(item => ({
              categoryId: item.orderItems[0]?.product?.category?.id,
              categoryName: item.orderItems[0]?.product?.category?.name,
              orderCount: parseInt(item.getDataValue('orderCount'))
            }))
          }
        }
      });

    } catch (error) {
      logger.error('Get user statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();
