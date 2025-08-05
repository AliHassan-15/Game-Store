const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const CartItem = sequelize.define('CartItem', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique cart item identifier'
  },

  // Cart relationship
  cartId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Cart ID'
  },

  // Product relationship
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Product ID'
  },

  // Quantity
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: [1],
        msg: 'Quantity must be at least 1'
      },
      max: {
        args: [999],
        msg: 'Quantity cannot exceed 999'
      }
    },
    comment: 'Item quantity'
  },

  // Price at time of adding to cart (for price protection)
  priceAtAdd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Price cannot be negative'
      }
    },
    comment: 'Product price when added to cart'
  },

  // Item total
  itemTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Item total cannot be negative'
      }
    },
    comment: 'Total price for this item (price * quantity)'
  },

  // Additional options
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional item options (size, color, etc.)'
  },

  // Notes for this specific item
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Item-specific notes'
  },

  // Item status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Item active status'
  }

}, {
  // Table configuration
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a cart item
    beforeCreate: async (cartItem) => {
      // Get product price
      const product = await sequelize.models.Product.findByPk(cartItem.productId);
      if (product) {
        cartItem.priceAtAdd = parseFloat(product.price);
        cartItem.itemTotal = cartItem.priceAtAdd * cartItem.quantity;
      }
    },

    // Before updating a cart item
    beforeUpdate: async (cartItem) => {
      // Recalculate item total if quantity changed
      if (cartItem.changed('quantity')) {
        cartItem.itemTotal = cartItem.priceAtAdd * cartItem.quantity;
      }
    },

    // After creating a cart item
    afterCreate: async (cartItem) => {
      // Update cart totals
      const cart = await cartItem.getCart();
      if (cart) {
        await cart.updateTotals();
      }
    },

    // After updating a cart item
    afterUpdate: async (cartItem) => {
      // Update cart totals
      const cart = await cartItem.getCart();
      if (cart) {
        await cart.updateTotals();
      }
    },

    // After destroying a cart item
    afterDestroy: async (cartItem) => {
      // Update cart totals
      const cart = await sequelize.models.Cart.findByPk(cartItem.cartId);
      if (cart) {
        await cart.updateTotals();
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['cart_id', 'product_id'],
      name: 'cart_items_cart_product_unique'
    },
    {
      fields: ['cart_id'],
      name: 'cart_items_cart_id_index'
    },
    {
      fields: ['product_id'],
      name: 'cart_items_product_id_index'
    },
    {
      fields: ['is_active'],
      name: 'cart_items_active_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Get cart item with product details
CartItem.prototype.getWithProduct = async function() {
  const product = await this.getProduct();
  
  return {
    ...this.toJSON(),
    product: product
  };
};

// Get cart item with full details
CartItem.prototype.getWithFullDetails = async function() {
  const product = await this.getProduct({
    include: [{
      model: sequelize.models.Category,
      as: 'category',
      attributes: ['id', 'name', 'slug']
    }]
  });
  
  return {
    ...this.toJSON(),
    product: product
  };
};

// Check if item is in stock
CartItem.prototype.isInStock = async function() {
  const product = await this.getProduct();
  return product && product.stockQuantity >= this.quantity;
};

// Check if item quantity exceeds stock
CartItem.prototype.exceedsStock = async function() {
  const product = await this.getProduct();
  return product && this.quantity > product.stockQuantity;
};

// Get available stock for this item
CartItem.prototype.getAvailableStock = async function() {
  const product = await this.getProduct();
  return product ? product.stockQuantity : 0;
};

// Update quantity with stock validation
CartItem.prototype.updateQuantity = async function(newQuantity) {
  const product = await this.getProduct();
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (newQuantity > product.stockQuantity) {
    throw new Error(`Only ${product.stockQuantity} items available in stock`);
  }
  
  if (newQuantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  
  this.quantity = newQuantity;
  this.itemTotal = this.priceAtAdd * newQuantity;
  await this.save();
  
  return this;
};

// Increment quantity
CartItem.prototype.incrementQuantity = async function(amount = 1) {
  const newQuantity = this.quantity + amount;
  return await this.updateQuantity(newQuantity);
};

// Decrement quantity
CartItem.prototype.decrementQuantity = async function(amount = 1) {
  const newQuantity = Math.max(1, this.quantity - amount);
  return await this.updateQuantity(newQuantity);
};

// Check if price has changed since adding to cart
CartItem.prototype.hasPriceChanged = async function() {
  const product = await this.getProduct();
  if (!product) return false;
  
  return parseFloat(product.price) !== parseFloat(this.priceAtAdd);
};

// Get price difference
CartItem.prototype.getPriceDifference = async function() {
  const product = await this.getProduct();
  if (!product) return 0;
  
  const currentPrice = parseFloat(product.price);
  const cartPrice = parseFloat(this.priceAtAdd);
  
  return currentPrice - cartPrice;
};

// Update price to current product price
CartItem.prototype.updatePrice = async function() {
  const product = await this.getProduct();
  if (!product) return this;
  
  this.priceAtAdd = parseFloat(product.price);
  this.itemTotal = this.priceAtAdd * this.quantity;
  await this.save();
  
  return this;
};

/**
 * Class Methods
 */

// Find cart item by cart and product
CartItem.findByCartAndProduct = async function(cartId, productId) {
  return await this.findOne({
    where: { 
      cartId: cartId,
      productId: productId,
      isActive: true 
    }
  });
};

// Find all items in a cart
CartItem.findByCart = async function(cartId) {
  return await this.findAll({
    where: { 
      cartId: cartId,
      isActive: true 
    },
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      where: { isActive: true },
      required: true
    }],
    order: [['createdAt', 'ASC']]
  });
};

// Find cart items with product details
CartItem.findWithProducts = async function(cartId) {
  return await this.findAll({
    where: { 
      cartId: cartId,
      isActive: true 
    },
    include: [{
      model: sequelize.models.Product,
      as: 'product',
      where: { isActive: true },
      required: true,
      include: [{
        model: sequelize.models.Category,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      }]
    }],
    order: [['createdAt', 'ASC']]
  });
};

// Add item to cart
CartItem.addToCart = async function(cartId, productId, quantity = 1, options = {}) {
  // Check if item already exists in cart
  const existingItem = await this.findByCartAndProduct(cartId, productId);
  
  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    await existingItem.updateQuantity(newQuantity);
    return existingItem;
  } else {
    // Create new cart item
    return await this.create({
      cartId: cartId,
      productId: productId,
      quantity: quantity,
      options: options
    });
  }
};

// Remove item from cart
CartItem.removeFromCart = async function(cartId, productId) {
  const cartItem = await this.findByCartAndProduct(cartId, productId);
  
  if (cartItem) {
    await cartItem.destroy();
    return true;
  }
  
  return false;
};

// Update item quantity in cart
CartItem.updateQuantityInCart = async function(cartId, productId, quantity) {
  const cartItem = await this.findByCartAndProduct(cartId, productId);
  
  if (cartItem) {
    await cartItem.updateQuantity(quantity);
    return cartItem;
  }
  
  return null;
};

// Clear all items from cart
CartItem.clearCart = async function(cartId) {
  return await this.destroy({
    where: { 
      cartId: cartId,
      isActive: true 
    }
  });
};

// Validate cart items stock
CartItem.validateStock = async function(cartId) {
  const cartItems = await this.findWithProducts(cartId);
  const validationResults = [];
  
  for (const item of cartItems) {
    const isInStock = await item.isInStock();
    const availableStock = await item.getAvailableStock();
    
    validationResults.push({
      item: item,
      isInStock: isInStock,
      availableStock: availableStock,
      requestedQuantity: item.quantity,
      canFulfill: isInStock && item.quantity <= availableStock
    });
  }
  
  return validationResults;
};

// Get cart items with price changes
CartItem.findWithPriceChanges = async function(cartId) {
  const cartItems = await this.findWithProducts(cartId);
  const itemsWithPriceChanges = [];
  
  for (const item of cartItems) {
    const hasPriceChanged = await item.hasPriceChanged();
    if (hasPriceChanged) {
      const priceDifference = await item.getPriceDifference();
      itemsWithPriceChanges.push({
        item: item,
        priceDifference: priceDifference,
        currentPrice: parseFloat(item.product.price),
        cartPrice: parseFloat(item.priceAtAdd)
      });
    }
  }
  
  return itemsWithPriceChanges;
};

module.exports = CartItem;
