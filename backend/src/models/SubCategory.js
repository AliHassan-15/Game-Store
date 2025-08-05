const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * SubCategory Model - Represents subcategories within main categories
 * 
 * This model handles:
 * - Subcategories within main categories (e.g., "Action Games" under "Gaming")
 * - Product organization hierarchy
 * - Admin category management
 * - Product filtering and navigation
 */
const SubCategory = sequelize.define('SubCategory', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique subcategory identifier'
  },

  // Subcategory information
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Subcategory name is required'
      },
      len: {
        args: [2, 100],
        msg: 'Subcategory name must be between 2 and 100 characters'
      }
    },
    comment: 'Subcategory name'
  },

  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Subcategory slug is required'
      },
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    },
    comment: 'URL-friendly subcategory identifier'
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Subcategory description'
  },

  // Visual representation
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Subcategory image must be a valid URL'
      }
    },
    comment: 'Subcategory image URL'
  },

  // Parent category relationship
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'Parent category ID'
  },

  // Subcategory status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Subcategory active status'
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
    comment: 'Order for displaying subcategories'
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
  tableName: 'sub_categories',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating a subcategory
    beforeCreate: async (subcategory) => {
      // Generate slug if not provided
      if (!subcategory.slug) {
        subcategory.slug = subcategory.generateSlug();
      }
      
      // Normalize name
      subcategory.name = subcategory.name.trim();
    },

    // Before updating a subcategory
    beforeUpdate: async (subcategory) => {
      // Generate slug if name changed and slug not provided
      if (subcategory.changed('name') && !subcategory.changed('slug')) {
        subcategory.slug = subcategory.generateSlug();
      }
      
      // Normalize name if changed
      if (subcategory.changed('name')) {
        subcategory.name = subcategory.name.trim();
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['category_id', 'slug'],
      name: 'sub_categories_category_slug_unique'
    },
    {
      fields: ['category_id'],
      name: 'sub_categories_category_id_index'
    },
    {
      fields: ['is_active'],
      name: 'sub_categories_active_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Generate URL-friendly slug from name
SubCategory.prototype.generateSlug = function() {
  return this.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Get subcategory with parent category
SubCategory.prototype.getWithParent = async function() {
  const parentCategory = await this.getCategory();
  
  return {
    ...this.toJSON(),
    parentCategory: parentCategory
  };
};

// Get subcategory with product count
SubCategory.prototype.getWithProductCount = async function() {
  const productCount = await this.countProducts({
    where: { isActive: true }
  });
  
  return {
    ...this.toJSON(),
    productCount: productCount
  };
};

// Check if subcategory has products
SubCategory.prototype.hasProducts = async function() {
  const productCount = await this.countProducts({
    where: { isActive: true }
  });
  return productCount > 0;
};

// Get full category path (Category > SubCategory)
SubCategory.prototype.getCategoryPath = async function() {
  const parentCategory = await this.getCategory();
  
  return {
    category: parentCategory,
    subcategory: this,
    path: `${parentCategory.name} > ${this.name}`,
    slugPath: `${parentCategory.slug}/${this.slug}`
  };
};

/**
 * Class Methods
 */

// Find subcategory by slug within a category
SubCategory.findBySlug = async function(categoryId, slug) {
  return await this.findOne({
    where: { 
      categoryId: categoryId,
      slug: slug,
      isActive: true 
    }
  });
};

// Find active subcategories by category
SubCategory.findByCategory = async function(categoryId) {
  return await this.findAll({
    where: { 
      categoryId: categoryId,
      isActive: true 
    },
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });
};

// Find subcategories with product counts
SubCategory.findWithProductCounts = async function(categoryId = null) {
  const whereClause = { isActive: true };
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  const subcategories = await this.findAll({
    where: whereClause,
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
    group: ['SubCategory.id'],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });

  return subcategories.map(subcategory => ({
    ...subcategory.toJSON(),
    productCount: parseInt(subcategory.getDataValue('productCount') || 0)
  }));
};

// Find subcategories with parent category
SubCategory.findWithParent = async function() {
  return await this.findAll({
    where: { isActive: true },
    include: [{
      model: sequelize.models.Category,
      as: 'category',
      where: { isActive: true },
      required: true
    }],
    order: [
      [{ model: sequelize.models.Category, as: 'category' }, 'displayOrder', 'ASC'],
      [{ model: sequelize.models.Category, as: 'category' }, 'name', 'ASC'],
      ['displayOrder', 'ASC'],
      ['name', 'ASC']
    ]
  });
};

// Search subcategories by name
SubCategory.searchByName = async function(searchTerm, categoryId = null) {
  const whereClause = {
    name: {
      [sequelize.Op.iLike]: `%${searchTerm}%`
    },
    isActive: true
  };

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  return await this.findAll({
    where: whereClause,
    order: [['name', 'ASC']]
  });
};

// Get subcategories with product counts by category
SubCategory.getByCategoryWithCounts = async function(categoryId) {
  const subcategories = await this.findAll({
    where: { 
      categoryId: categoryId,
      isActive: true 
    },
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
    group: ['SubCategory.id'],
    order: [['displayOrder', 'ASC'], ['name', 'ASC']]
  });

  return subcategories.map(subcategory => ({
    ...subcategory.toJSON(),
    productCount: parseInt(subcategory.getDataValue('productCount') || 0)
  }));
};

module.exports = SubCategory;
