const { Cart, CartItem, Product, User } = require('../../models');
const logger = require('../../utils/logger/logger');
class CartController {

  async getCart(req, res) {
    try {
      const userId = req.user?.id;

      // If no user is authenticated, return empty cart
      if (!userId) {
        return res.json({
          success: true,
          data: {
            cart: {
              id: null,
              userId: null,
              subtotal: 0,
              totalItems: 0,
              items: []
            }
          }
        });
      }

      // Find or create user's cart
      let cart = await Cart.findOne({
        where: { userId, isActive: true },
        include: [
          {
            model: CartItem,
            as: 'cartItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug', 'price', 'comparePrice', 'mainImage', 'stockQuantity', 'isActive']
              }
            ]
          }
        ]
      });

      if (!cart) {
        // Create new cart if doesn't exist
        cart = await Cart.create({
          userId,
          isActive: true
        });
      }

      // Calculate cart totals
      const cartItems = cart.cartItems || [];
      const subtotal = cartItems.reduce((sum, item) => {
        if (item.product && item.product.isActive) {
          return sum + (item.product.price * item.quantity);
        }
        return sum;
      }, 0);

      const totalItems = cartItems.reduce((sum, item) => {
        if (item.product && item.product.isActive) {
          return sum + item.quantity;
        }
        return sum;
      }, 0);

      res.json({
        success: true,
        data: {
          cart: {
            id: cart.id,
            userId: cart.userId,
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalItems,
            items: cartItems.map(item => ({
              id: item.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.product ? item.product.price : 0,
              comparePrice: item.product ? item.product.comparePrice : null,
              product: item.product ? {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                mainImage: item.product.mainImage,
                stockQuantity: item.product.stockQuantity,
                isActive: item.product.isActive
              } : null
            }))
          }
        }
      });

    } catch (error) {
      logger.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add item to cart
   * POST /api/v1/cart/add
   */
  async addToCart(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      // Check if product exists and is active
      const product = await Product.findOne({
        where: { id: productId, isActive: true }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or inactive'
        });
      }

      // Check stock availability
      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockQuantity} items available in stock`
        });
      }

      // Find or create user's cart
      let cart = await Cart.findOne({
        where: { userId, isActive: true }
      });

      if (!cart) {
        cart = await Cart.create({
          userId,
          isActive: true
        });
      }

      // Check if item already exists in cart
      let cartItem = await CartItem.findOne({
        where: { cartId: cart.id, productId }
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + quantity;
        
        // Check stock again with new quantity
        if (product.stockQuantity < newQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot add ${quantity} more items. Only ${product.stockQuantity - cartItem.quantity} additional items available`
          });
        }

        await cartItem.update({ quantity: newQuantity });
      } else {
        // Create new cart item
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId,
          quantity
        });
      }

      // Get updated cart
      const updatedCart = await Cart.findOne({
        where: { id: cart.id },
        include: [
          {
            model: CartItem,
            as: 'cartItems',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'slug', 'price', 'comparePrice', 'mainImage', 'stockQuantity']
              }
            ]
          }
        ]
      });

      // Calculate totals
      const cartItems = updatedCart.cartItems || [];
      const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
      }, 0);

      const totalItems = cartItems.reduce((sum, item) => {
        return sum + item.quantity;
      }, 0);

      logger.info(`Item added to cart: Product ${productId}, Quantity ${quantity}, User ${userId}`);

      res.json({
        success: true,
        message: 'Item added to cart successfully',
        data: {
          cartItem: {
            id: cartItem.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              mainImage: product.mainImage
            }
          },
          cart: {
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalItems
          }
        }
      });

    } catch (error) {
      logger.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update cart item quantity
   * PUT /api/v1/cart/update/:itemId
   */
  async updateCartItem(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;

      // Validate input
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      // Find cart item
      const cartItem = await CartItem.findOne({
        where: { id: itemId },
        include: [
          {
            model: Cart,
            as: 'cart',
            where: { userId, isActive: true }
          },
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      // Check stock availability
      if (cartItem.product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${cartItem.product.stockQuantity} items available in stock`
        });
      }

      // Update quantity
      await cartItem.update({ quantity });

      logger.info(`Cart item updated: Item ${itemId}, Quantity ${quantity}, User ${userId}`);

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        data: {
          cartItem: {
            id: cartItem.id,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            product: {
              id: cartItem.product.id,
              name: cartItem.product.name,
              price: cartItem.product.price
            }
          }
        }
      });

    } catch (error) {
      logger.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Remove item from cart
   * DELETE /api/v1/cart/remove/:itemId
   */
  async removeFromCart(req, res) {
    try {
      const { itemId } = req.params;
      const userId = req.user.id;

      // Find cart item
      const cartItem = await CartItem.findOne({
        where: { id: itemId },
        include: [
          {
            model: Cart,
            as: 'cart',
            where: { userId, isActive: true }
          }
        ]
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      // Delete cart item
      await cartItem.destroy();

      logger.info(`Item removed from cart: Item ${itemId}, User ${userId}`);

      res.json({
        success: true,
        message: 'Item removed from cart successfully'
      });

    } catch (error) {
      logger.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Clear entire cart
   * DELETE /api/v1/cart/clear
   */
  async clearCart(req, res) {
    try {
      const userId = req.user.id;

      // Find user's cart
      const cart = await Cart.findOne({
        where: { userId, isActive: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // Delete all cart items
      await CartItem.destroy({
        where: { cartId: cart.id }
      });

      logger.info(`Cart cleared: User ${userId}`);

      res.json({
        success: true,
        message: 'Cart cleared successfully'
      });

    } catch (error) {
      logger.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get cart summary (for checkout)
   * GET /api/v1/cart/summary
   */
  async getCartSummary(req, res) {
    try {
      const userId = req.user.id;

      // Get user's cart with items
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
                attributes: ['id', 'name', 'slug', 'price', 'comparePrice', 'mainImage', 'stockQuantity', 'isActive']
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
            id: item.id,
            reason: 'Product not available'
          });
          continue;
        }

        if (item.product.stockQuantity < item.quantity) {
          invalidItems.push({
            id: item.id,
            productId: item.productId,
            reason: `Only ${item.product.stockQuantity} items available`
          });
          continue;
        }

        validItems.push(item);
        subtotal += item.product.price * item.quantity;
      }

      // If there are invalid items, return them
      if (invalidItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some items in your cart are no longer available',
          data: {
            invalidItems,
            validItems: validItems.length
          }
        });
      }

      const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);

      res.json({
        success: true,
        data: {
          cartId: cart.id,
          items: validItems.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity,
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              mainImage: item.product.mainImage
            }
          })),
          summary: {
            subtotal: parseFloat(subtotal.toFixed(2)),
            totalItems,
            itemCount: validItems.length
          }
        }
      });

    } catch (error) {
      logger.error('Get cart summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart summary',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Validate cart before checkout
   * POST /api/v1/cart/validate
   */
  async validateCart(req, res) {
    try {
      const userId = req.user.id;

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
          message: 'Cart is empty',
          data: { isValid: false }
        });
      }

      const validationResults = {
        isValid: true,
        errors: [],
        warnings: []
      };

      for (const item of cart.cartItems) {
        if (!item.product) {
          validationResults.errors.push({
            itemId: item.id,
            message: 'Product not found'
          });
          validationResults.isValid = false;
          continue;
        }

        if (!item.product.isActive) {
          validationResults.errors.push({
            itemId: item.id,
            productId: item.productId,
            message: 'Product is no longer available'
          });
          validationResults.isValid = false;
          continue;
        }

        if (item.product.stockQuantity < item.quantity) {
          validationResults.errors.push({
            itemId: item.id,
            productId: item.productId,
            message: `Only ${item.product.stockQuantity} items available`
          });
          validationResults.isValid = false;
          continue;
        }

        if (item.product.stockQuantity <= 5) {
          validationResults.warnings.push({
            itemId: item.id,
            productId: item.productId,
            message: `Only ${item.product.stockQuantity} items left in stock`
          });
        }
      }

      res.json({
        success: true,
        data: validationResults
      });

    } catch (error) {
      logger.error('Validate cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Apply coupon/discount to cart
   * POST /api/v1/cart/apply-coupon
   */
  async applyCoupon(req, res) {
    try {
      const { couponCode } = req.body;
      const userId = req.user.id;

      // Get user's cart
      const cart = await Cart.findOne({
        where: { userId, isActive: true }
      });

      if (!cart) {
        return res.status(400).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // TODO: Implement coupon validation logic
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          discount: 0,
          couponCode
        }
      });

    } catch (error) {
      logger.error('Apply coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply coupon',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Remove coupon/discount from cart
   * DELETE /api/v1/cart/remove-coupon
   */
  async removeCoupon(req, res) {
    try {
      const userId = req.user.id;

      // Get user's cart
      const cart = await Cart.findOne({
        where: { userId, isActive: true }
      });

      if (!cart) {
        return res.status(400).json({
          success: false,
          message: 'Cart not found'
        });
      }

      // TODO: Implement coupon removal logic
      res.json({
        success: true,
        message: 'Coupon removed successfully'
      });

    } catch (error) {
      logger.error('Remove coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove coupon',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Save cart for later
   * POST /api/v1/cart/save
   */
  async saveCart(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;

      // Get user's current cart
      const cart = await Cart.findOne({
        where: { userId, isActive: true },
        include: [
          {
            model: CartItem,
            as: 'cartItems'
          }
        ]
      });

      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty'
        });
      }

      // TODO: Implement cart saving logic
      res.json({
        success: true,
        message: 'Cart saved successfully',
        data: {
          savedCartId: 'temp-id',
          name
        }
      });

    } catch (error) {
      logger.error('Save cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get saved carts
   * GET /api/v1/cart/saved
   */
  async getSavedCarts(req, res) {
    try {
      const userId = req.user.id;

      // TODO: Implement saved carts retrieval
      res.json({
        success: true,
        data: {
          savedCarts: []
        }
      });

    } catch (error) {
      logger.error('Get saved carts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get saved carts',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Load saved cart
   * POST /api/v1/cart/load/:cartId
   */
  async loadSavedCart(req, res) {
    try {
      const { cartId } = req.params;
      const userId = req.user.id;

      // TODO: Implement saved cart loading logic
      res.json({
        success: true,
        message: 'Saved cart loaded successfully'
      });

    } catch (error) {
      logger.error('Load saved cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load saved cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete saved cart
   * DELETE /api/v1/cart/saved/:cartId
   */
  async deleteSavedCart(req, res) {
    try {
      const { cartId } = req.params;
      const userId = req.user.id;

      // TODO: Implement saved cart deletion logic
      res.json({
        success: true,
        message: 'Saved cart deleted successfully'
      });

    } catch (error) {
      logger.error('Delete saved cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete saved cart',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new CartController();
