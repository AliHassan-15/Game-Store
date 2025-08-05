const { Category, SubCategory, Product } = require('../../models');
const { sequelize } = require('../../config/database');
const logger = require('../../utils/logger/logger');
const xlsx = require('xlsx');
class CategoryController {

  async getAllCategories(req, res) {
    try {
      const { includeSubcategories = true, includeProductCount = true } = req.query;

      const includeOptions = [];
      
      if (includeSubcategories === 'true') {
        includeOptions.push({
          model: SubCategory,
          as: 'subCategories',
          attributes: ['id', 'name', 'slug', 'description', 'isActive']
        });
      }

      const categories = await Category.findAll({
        where: { isActive: true },
        include: includeOptions,
        order: [['name', 'ASC']]
      });

      let result = categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        subCategories: category.subCategories || []
      }));

      // Add product count if requested
      if (includeProductCount === 'true') {
        result = await Promise.all(
          result.map(async (category) => {
            const productCount = await Product.count({
              where: { categoryId: category.id, isActive: true }
            });
            return { ...category, productCount };
          })
        );
      }

      res.json({
        success: true,
        data: {
          categories: result
        }
      });

    } catch (error) {
      logger.error('Get all categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get categories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }


  async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, {
        include: [
          {
            model: SubCategory,
            as: 'subCategories',
            attributes: ['id', 'name', 'slug', 'description', 'isActive']
          },
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'slug', 'price', 'mainImage', 'stockQuantity', 'isActive'],
            where: { isActive: true },
            required: false
          }
        ]
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: {
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            isActive: category.isActive,
            createdAt: category.createdAt,
            subCategories: category.subCategories,
            products: category.products,
            productCount: category.products.length
          }
        }
      });

    } catch (error) {
      logger.error('Get category by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create new category
   * POST /api/v1/categories
   */
  async createCategory(req, res) {
    try {
      const { name, description, slug } = req.body;

      // Validate input
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      // Check if category already exists
      const existingCategory = await Category.findOne({
        where: { 
          [sequelize.Op.or]: [
            { name: name.trim() },
            { slug: slug || name.toLowerCase().replace(/\s+/g, '-') }
          ]
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name or slug already exists'
        });
      }

      // Create category
      const category = await Category.create({
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description: description || null
      });

      logger.info(`Category created: ${category.name}`);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: {
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            isActive: category.isActive,
            createdAt: category.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update category
   * PUT /api/v1/categories/:id
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, slug, isActive } = req.body;

      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if new name/slug conflicts with existing category
      if (name || slug) {
        const existingCategory = await Category.findOne({
          where: {
            [sequelize.Op.or]: [
              { name: name || category.name },
              { slug: slug || category.slug }
            ],
            id: { [sequelize.Op.ne]: id }
          }
        });

        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name or slug already exists'
          });
        }
      }

      // Update category
      await category.update({
        name: name ? name.trim() : category.name,
        slug: slug || category.slug,
        description: description !== undefined ? description : category.description,
        isActive: isActive !== undefined ? isActive : category.isActive
      });

      logger.info(`Category updated: ${category.name}`);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: {
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            isActive: category.isActive,
            updatedAt: category.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete category
   * DELETE /api/v1/categories/:id
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has products
      if (category.products && category.products.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with existing products',
          data: {
            productCount: category.products.length,
            products: category.products.map(p => ({ id: p.id, name: p.name }))
          }
        });
      }

      // Delete category
      await category.destroy();

      logger.info(`Category deleted: ${category.name}`);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all subcategories
   * GET /api/v1/subcategories
   */
  async getAllSubcategories(req, res) {
    try {
      const { categoryId, includeProductCount = true } = req.query;

      const whereClause = { isActive: true };
      if (categoryId) whereClause.categoryId = categoryId;

      const includeOptions = [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ];

      const subcategories = await SubCategory.findAll({
        where: whereClause,
        include: includeOptions,
        order: [['name', 'ASC']]
      });

      let result = subcategories.map(subcategory => ({
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        description: subcategory.description,
        isActive: subcategory.isActive,
        categoryId: subcategory.categoryId,
        category: subcategory.category,
        createdAt: subcategory.createdAt
      }));

      // Add product count if requested
      if (includeProductCount === 'true') {
        result = await Promise.all(
          result.map(async (subcategory) => {
            const productCount = await Product.count({
              where: { subCategoryId: subcategory.id, isActive: true }
            });
            return { ...subcategory, productCount };
          })
        );
      }

      res.json({
        success: true,
        data: {
          subcategories: result
        }
      });

    } catch (error) {
      logger.error('Get all subcategories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get subcategories',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create subcategory
   * POST /api/v1/subcategories
   */
  async createSubcategory(req, res) {
    try {
      const { name, description, slug, categoryId } = req.body;

      // Validate input
      if (!name || !categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory name and category ID are required'
        });
      }

      // Check if category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Check if subcategory already exists
      const existingSubcategory = await SubCategory.findOne({
        where: { 
          [sequelize.Op.or]: [
            { name: name.trim() },
            { slug: slug || name.toLowerCase().replace(/\s+/g, '-') }
          ]
        }
      });

      if (existingSubcategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory with this name or slug already exists'
        });
      }

      // Create subcategory
      const subcategory = await SubCategory.create({
        name: name.trim(),
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description: description || null,
        categoryId
      });

      logger.info(`Subcategory created: ${subcategory.name} under category: ${category.name}`);

      res.status(201).json({
        success: true,
        message: 'Subcategory created successfully',
        data: {
          subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description,
            categoryId: subcategory.categoryId,
            isActive: subcategory.isActive,
            createdAt: subcategory.createdAt
          }
        }
      });

    } catch (error) {
      logger.error('Create subcategory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subcategory',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update subcategory
   * PUT /api/v1/subcategories/:id
   */
  async updateSubcategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, slug, isActive, categoryId } = req.body;

      const subcategory = await SubCategory.findByPk(id);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      // Check if new name/slug conflicts with existing subcategory
      if (name || slug) {
        const existingSubcategory = await SubCategory.findOne({
          where: {
            [sequelize.Op.or]: [
              { name: name || subcategory.name },
              { slug: slug || subcategory.slug }
            ],
            id: { [sequelize.Op.ne]: id }
          }
        });

        if (existingSubcategory) {
          return res.status(400).json({
            success: false,
            message: 'Subcategory with this name or slug already exists'
          });
        }
      }

      // Check if new category exists (if changing category)
      if (categoryId && categoryId !== subcategory.categoryId) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(404).json({
            success: false,
            message: 'Parent category not found'
          });
        }
      }

      // Update subcategory
      await subcategory.update({
        name: name ? name.trim() : subcategory.name,
        slug: slug || subcategory.slug,
        description: description !== undefined ? description : subcategory.description,
        isActive: isActive !== undefined ? isActive : subcategory.isActive,
        categoryId: categoryId || subcategory.categoryId
      });

      logger.info(`Subcategory updated: ${subcategory.name}`);

      res.json({
        success: true,
        message: 'Subcategory updated successfully',
        data: {
          subcategory: {
            id: subcategory.id,
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description,
            categoryId: subcategory.categoryId,
            isActive: subcategory.isActive,
            updatedAt: subcategory.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Update subcategory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subcategory',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete subcategory
   * DELETE /api/v1/subcategories/:id
   */
  async deleteSubcategory(req, res) {
    try {
      const { id } = req.params;

      const subcategory = await SubCategory.findByPk(id, {
        include: [
          {
            model: Product,
            as: 'products',
            attributes: ['id', 'name']
          }
        ]
      });

      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      // Check if subcategory has products
      if (subcategory.products && subcategory.products.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete subcategory with existing products',
          data: {
            productCount: subcategory.products.length,
            products: subcategory.products.map(p => ({ id: p.id, name: p.name }))
          }
        });
      }

      // Delete subcategory
      await subcategory.destroy();

      logger.info(`Subcategory deleted: ${subcategory.name}`);

      res.json({
        success: true,
        message: 'Subcategory deleted successfully'
      });

    } catch (error) {
      logger.error('Delete subcategory error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subcategory',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Import categories and subcategories from Excel
   * POST /api/v1/categories/import
   */
  async importFromExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is required'
        });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      if (!data || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty or invalid'
        });
      }

      const results = {
        categories: { created: 0, updated: 0, errors: 0 },
        subcategories: { created: 0, updated: 0, errors: 0 },
        errors: []
      };

      // Process each row
      for (const row of data) {
        try {
          const { category_name, category_description, subcategory_name, subcategory_description } = row;

          if (!category_name) {
            results.errors.push(`Row ${data.indexOf(row) + 1}: Category name is required`);
            results.categories.errors++;
            continue;
          }

          // Create or update category
          let category = await Category.findOne({
            where: { name: category_name.trim() }
          });

          if (category) {
            await category.update({
              description: category_description || category.description
            });
            results.categories.updated++;
          } else {
            category = await Category.create({
              name: category_name.trim(),
              slug: category_name.toLowerCase().replace(/\s+/g, '-'),
              description: category_description || null
            });
            results.categories.created++;
          }

          // Create subcategory if provided
          if (subcategory_name) {
            let subcategory = await SubCategory.findOne({
              where: { 
                name: subcategory_name.trim(),
                categoryId: category.id
              }
            });

            if (subcategory) {
              await subcategory.update({
                description: subcategory_description || subcategory.description
              });
              results.subcategories.updated++;
            } else {
              await SubCategory.create({
                name: subcategory_name.trim(),
                slug: subcategory_name.toLowerCase().replace(/\s+/g, '-'),
                description: subcategory_description || null,
                categoryId: category.id
              });
              results.subcategories.created++;
            }
          }

        } catch (error) {
          results.errors.push(`Row ${data.indexOf(row) + 1}: ${error.message}`);
          results.categories.errors++;
        }
      }

      logger.info(`Excel import completed: ${results.categories.created} categories, ${results.subcategories.created} subcategories created`);

      res.json({
        success: true,
        message: 'Import completed successfully',
        data: results
      });

    } catch (error) {
      logger.error('Import from Excel error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import from Excel',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Export categories and subcategories to Excel
   * GET /api/v1/categories/export
   */
  async exportToExcel(req, res) {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: SubCategory,
            as: 'subCategories',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['name', 'ASC']]
      });

      // Prepare data for Excel
      const excelData = [];
      
      for (const category of categories) {
        if (category.subCategories && category.subCategories.length > 0) {
          // Add subcategories
          for (const subcategory of category.subCategories) {
            excelData.push({
              category_name: category.name,
              category_description: category.description,
              subcategory_name: subcategory.name,
              subcategory_description: subcategory.description
            });
          }
        } else {
          // Add category without subcategories
          excelData.push({
            category_name: category.name,
            category_description: category.description,
            subcategory_name: '',
            subcategory_description: ''
          });
        }
      }

      // Create workbook
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(excelData);
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // category_name
        { width: 30 }, // category_description
        { width: 20 }, // subcategory_name
        { width: 30 }  // subcategory_description
      ];

      xlsx.utils.book_append_sheet(workbook, worksheet, 'Categories');

      // Generate buffer
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

    } catch (error) {
      logger.error('Export to Excel error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export to Excel',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new CategoryController();
