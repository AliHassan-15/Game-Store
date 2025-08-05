const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Category = sequelize.define('Category', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique category identifier'
  },

  // Category information
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Category name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Category name must be between 2 and 100 characters'
      }
    },
    comment: 'Category name (unique)'
  },

  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Category slug is required'
      },
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    },
    comment: 'URL-friendly category identifier'
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Category description'
  },

  // Visual representation
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Category image must be a valid URL'
      }
    },
    comment: 'Category image URL'
  },

  // Category status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Category active status'
  },

  // Display order
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Display order must be 0 or greater'
      }
    },
    comment: 'Order for displaying categories'
  },

  // SEO fields
  metaTitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'SEO meta title'
  },

  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO meta description'
  },

  metaKeywords: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'SEO meta keywords'
  }

}, {
  // Table configuration
  tableName: 'categories',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a category
    beforeCreate: async (category) => {
      // Generate slug if not provided
      if (!category.slug) {
        category.slug = category.generateSlug();
      }
      
      // Normalize name
      category.name = category.name.trim();
    },

    // Before updating a category
    beforeUpdate: async (category) => {
      // Generate slug if name changed and slug not provided
      if (category.changed('name') && !category.changed('slug')) {
        category.slug = category.generateSlug();
      }
      
      // Normalize name if changed
      if (category.changed('name')) {
        category.name = category.name.trim();
      }
    }
  }
});

/**
 * Instance Methods
 */

// Generate URL-friendly slug from name
Category.prototype.generateSlug = function() {
  return this.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Get category with subcategories
Category.prototype.getWithSubcategories = async function() {
  const subcategories = await this.getSubCategories({
    where: { isActive: true },
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });
  
  return {
    ...this.toJSON(),
    subcategories: subcategories
  };
};

// Get category with product count
Category.prototype.getWithProductCount = async function() {
  const productCount = await this.countProducts({
    where: { isActive: true }
  });
  
  return {
    ...this.toJSON(),
    productCount: productCount
  };
};

// Check if category has products
Category.prototype.hasProducts = async function() {
  const productCount = await this.countProducts({
    where: { isActive: true }
  });
  return productCount > 0;
};

// Check if category has subcategories
Category.prototype.hasSubcategories = async function() {
  const subcategoryCount = await this.countSubCategories({
    where: { isActive: true }
  });
  return subcategoryCount > 0;
};

/**
 * Class Methods
 */

// Find category by slug
Category.findBySlug = async function(slug) {
  return await this.findOne({
    where: { 
      slug: slug,
      isActive: true 
    }
  });
};

// Find active categories
Category.findActiveCategories = async function() {
  return await this.findAll({
    where: { isActive: true },
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });
};

// Find categories with subcategories
Category.findWithSubcategories = async function() {
  return await this.findAll({
    where: { isActive: true },
    include: [{
      model: sequelize.models.SubCategory,
      as: 'subCategories',
      where: { isActive: true },
      required: false,
      order: [['displayOrder', 'ASC'], ['name', 'ASC']]
    }],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });
};

// Find categories with product counts
Category.findWithProductCounts = async function() {
  const categories = await this.findAll({
    where: { isActive: true },
    include: [{
      model: sequelize.models.Product,
      as: 'products',
      where: { isActive: true },
      required: false,
      attributes: []
    }],
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('products.id')), 'productCount']
      ]
    },
    group: ['Category.id'],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });

  return categories.map(category => ({
    ...category.toJSON(),
    productCount: parseInt(category.getDataValue('productCount') || 0)
  }));
};

// Search categories by name
Category.searchByName = async function(searchTerm) {
  return await this.findAll({
    where: {
      name: {
        [sequelize.Op.iLike]: `%${searchTerm}%`
      },
      isActive: true
    },
    order: [['name', 'ASC']]
  });
};

module.exports = Category;
