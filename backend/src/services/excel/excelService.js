const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const { Product, Category, SubCategory, User, Order, OrderItem } = require('../../models');
const logger = require('../../utils/logger/logger');

class ExcelService {
  /**
   * Export products to Excel
   */
  async exportProducts(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.categoryId) {
        whereClause.categoryId = filters.categoryId;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      const products = await Product.findAll({
        where: whereClause,
        include: [
          { model: Category, as: 'category', attributes: ['name'] },
          { model: SubCategory, as: 'subCategory', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      const data = products.map(product => ({
        'ID': product.id,
        'Name': product.name,
        'Description': product.description,
        'SKU': product.sku,
        'Barcode': product.barcode,
        'Price': product.price,
        'Compare Price': product.comparePrice,
        'Cost Price': product.costPrice,
        'Stock Quantity': product.stockQuantity,
        'Low Stock Threshold': product.lowStockThreshold,
        'Category': product.category?.name || '',
        'Subcategory': product.subCategory?.name || '',
        'Status': product.status,
        'Featured': product.isFeatured ? 'Yes' : 'No',
        'Available': product.isAvailable ? 'Yes' : 'No',
        'Weight': product.weight,
        'Dimensions': product.dimensions ? JSON.stringify(product.dimensions) : '',
        'Tags': product.tags ? product.tags.join(', ') : '',
        'Created At': product.createdAt,
        'Updated At': product.updatedAt
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const columnWidths = [
        { wch: 5 },   // ID
        { wch: 30 },  // Name
        { wch: 50 },  // Description
        { wch: 15 },  // SKU
        { wch: 15 },  // Barcode
        { wch: 10 },  // Price
        { wch: 12 },  // Compare Price
        { wch: 10 },  // Cost Price
        { wch: 12 },  // Stock Quantity
        { wch: 15 },  // Low Stock Threshold
        { wch: 20 },  // Category
        { wch: 20 },  // Subcategory
        { wch: 10 },  // Status
        { wch: 8 },   // Featured
        { wch: 10 },  // Available
        { wch: 8 },   // Weight
        { wch: 20 },  // Dimensions
        { wch: 30 },  // Tags
        { wch: 20 },  // Created At
        { wch: 20 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      const fileName = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../../../uploads/exports', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      XLSX.writeFile(workbook, filePath);

      logger.info(`Products exported to Excel: ${fileName}`);
      return { fileName, filePath, count: data.length };
    } catch (error) {
      logger.error('Export products error:', error);
      throw error;
    }
  }

  /**
   * Import products from Excel
   */
  async importProducts(filePath, options = {}) {
    try {
      const { overwrite = false, validateOnly = false } = options;

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        total: data.length,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel rows start at 1, header is row 1

        try {
          // Validate required fields
          if (!row.Name || !row.SKU || !row.Price) {
            results.errors.push({
              row: rowNumber,
              error: 'Missing required fields: Name, SKU, and Price are required'
            });
            results.skipped++;
            continue;
          }

          // Validate price
          const price = parseFloat(row.Price);
          if (isNaN(price) || price < 0) {
            results.errors.push({
              row: rowNumber,
              error: 'Invalid price value'
            });
            results.skipped++;
            continue;
          }

          // Check if product exists
          const existingProduct = await Product.findOne({
            where: { sku: row.SKU }
          });

          if (existingProduct) {
            if (!overwrite) {
              results.errors.push({
                row: rowNumber,
                error: `Product with SKU ${row.SKU} already exists`
              });
              results.skipped++;
              continue;
            }
          }

          // Find category by name
          let categoryId = null;
          if (row.Category) {
            const category = await Category.findOne({
              where: { name: row.Category }
            });
            if (category) {
              categoryId = category.id;
            } else {
              results.errors.push({
                row: rowNumber,
                error: `Category '${row.Category}' not found`
              });
              results.skipped++;
              continue;
            }
          }

          // Find subcategory by name
          let subCategoryId = null;
          if (row.Subcategory && categoryId) {
            const subCategory = await SubCategory.findOne({
              where: { 
                name: row.Subcategory,
                categoryId: categoryId
              }
            });
            if (subCategory) {
              subCategoryId = subCategory.id;
            }
          }

          const productData = {
            name: row.Name,
            description: row.Description || '',
            sku: row.SKU,
            barcode: row.Barcode || null,
            price: price,
            comparePrice: row['Compare Price'] ? parseFloat(row['Compare Price']) : null,
            costPrice: row['Cost Price'] ? parseFloat(row['Cost Price']) : null,
            stockQuantity: row['Stock Quantity'] ? parseInt(row['Stock Quantity']) : 0,
            lowStockThreshold: row['Low Stock Threshold'] ? parseInt(row['Low Stock Threshold']) : 10,
            categoryId: categoryId,
            subCategoryId: subCategoryId,
            status: row.Status || 'draft',
            isFeatured: row.Featured === 'Yes',
            isAvailable: row.Available !== 'No',
            weight: row.Weight ? parseFloat(row.Weight) : null,
            dimensions: row.Dimensions ? JSON.parse(row.Dimensions) : null,
            tags: row.Tags ? row.Tags.split(',').map(tag => tag.trim()) : []
          };

          if (validateOnly) {
            results.created++; // Count as valid
          } else {
            if (existingProduct) {
              await existingProduct.update(productData);
              results.updated++;
            } else {
              await Product.create(productData);
              results.created++;
            }
          }
        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message
          });
          results.skipped++;
        }
      }

      logger.info(`Products import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`);
      return results;
    } catch (error) {
      logger.error('Import products error:', error);
      throw error;
    }
  }

  /**
   * Export categories to Excel
   */
  async exportCategories() {
    try {
      const categories = await Category.findAll({
        include: [
          { model: SubCategory, as: 'subCategories', attributes: ['name', 'description'] }
        ],
        order: [['name', 'ASC']]
      });

      const data = categories.map(category => ({
        'ID': category.id,
        'Name': category.name,
        'Description': category.description,
        'Image': category.image,
        'Active': category.isActive ? 'Yes' : 'No',
        'Sort Order': category.sortOrder,
        'Product Count': category.subCategories?.length || 0,
        'Created At': category.createdAt,
        'Updated At': category.updatedAt
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const columnWidths = [
        { wch: 5 },   // ID
        { wch: 30 },  // Name
        { wch: 50 },  // Description
        { wch: 50 },  // Image
        { wch: 8 },   // Active
        { wch: 10 },  // Sort Order
        { wch: 12 },  // Product Count
        { wch: 20 },  // Created At
        { wch: 20 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');

      const fileName = `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../../../uploads/exports', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      XLSX.writeFile(workbook, filePath);

      logger.info(`Categories exported to Excel: ${fileName}`);
      return { fileName, filePath, count: data.length };
    } catch (error) {
      logger.error('Export categories error:', error);
      throw error;
    }
  }

  /**
   * Export orders to Excel
   */
  async exportOrders(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.startDate) {
        whereClause.createdAt = { [require('sequelize').Op.gte]: filters.startDate };
      }
      if (filters.endDate) {
        whereClause.createdAt = { 
          ...whereClause.createdAt,
          [require('sequelize').Op.lte]: filters.endDate 
        };
      }

      const orders = await Order.findAll({
        where: whereClause,
        include: [
          { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] },
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] }
        ],
        order: [['createdAt', 'DESC']]
      });

      const data = orders.map(order => ({
        'Order ID': order.id,
        'Order Number': order.orderNumber,
        'Customer': `${order.user?.firstName} ${order.user?.lastName}`,
        'Email': order.user?.email,
        'Status': order.status,
        'Total Amount': order.totalAmount,
        'Subtotal': order.subtotal,
        'Tax': order.tax,
        'Shipping': order.shippingCost,
        'Discount': order.discountAmount,
        'Payment Method': order.paymentMethod,
        'Payment Status': order.paymentStatus,
        'Items Count': order.items?.length || 0,
        'Created At': order.createdAt,
        'Updated At': order.updatedAt
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // Order ID
        { wch: 15 },  // Order Number
        { wch: 25 },  // Customer
        { wch: 30 },  // Email
        { wch: 12 },  // Status
        { wch: 12 },  // Total Amount
        { wch: 10 },  // Subtotal
        { wch: 8 },   // Tax
        { wch: 10 },  // Shipping
        { wch: 10 },  // Discount
        { wch: 15 },  // Payment Method
        { wch: 12 },  // Payment Status
        { wch: 10 },  // Items Count
        { wch: 20 },  // Created At
        { wch: 20 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      const fileName = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../../../uploads/exports', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      XLSX.writeFile(workbook, filePath);

      logger.info(`Orders exported to Excel: ${fileName}`);
      return { fileName, filePath, count: data.length };
    } catch (error) {
      logger.error('Export orders error:', error);
      throw error;
    }
  }

  /**
   * Export users to Excel
   */
  async exportUsers(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.role) {
        whereClause.role = filters.role;
      }
      if (filters.status) {
        whereClause.isActive = filters.status === 'active';
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] },
        order: [['createdAt', 'DESC']]
      });

      const data = users.map(user => ({
        'ID': user.id,
        'First Name': user.firstName,
        'Last Name': user.lastName,
        'Email': user.email,
        'Phone': user.phone,
        'Role': user.role,
        'Active': user.isActive ? 'Yes' : 'No',
        'Verified': user.isVerified ? 'Yes' : 'No',
        'Last Login': user.lastLogin,
        'Created At': user.createdAt,
        'Updated At': user.updatedAt
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const columnWidths = [
        { wch: 5 },   // ID
        { wch: 15 },  // First Name
        { wch: 15 },  // Last Name
        { wch: 30 },  // Email
        { wch: 15 },  // Phone
        { wch: 8 },   // Role
        { wch: 8 },   // Active
        { wch: 8 },   // Verified
        { wch: 20 },  // Last Login
        { wch: 20 },  // Created At
        { wch: 20 }   // Updated At
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

      const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../../../uploads/exports', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      XLSX.writeFile(workbook, filePath);

      logger.info(`Users exported to Excel: ${fileName}`);
      return { fileName, filePath, count: data.length };
    } catch (error) {
      logger.error('Export users error:', error);
      throw error;
    }
  }

  /**
   * Generate sales report
   */
  async generateSalesReport(startDate, endDate, groupBy = 'day') {
    try {
      const whereClause = {
        createdAt: {
          [require('sequelize').Op.between]: [startDate, endDate]
        },
        status: { [require('sequelize').Op.in]: ['delivered', 'shipped'] }
      };

      const orders = await Order.findAll({
        where: whereClause,
        attributes: [
          'id',
          'totalAmount',
          'createdAt',
          [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date']
        ],
        order: [['createdAt', 'ASC']]
      });

      // Group by date
      const groupedData = {};
      orders.forEach(order => {
        const date = order.getDataValue('date');
        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            orders: 0,
            revenue: 0
          };
        }
        groupedData[date].orders++;
        groupedData[date].revenue += parseFloat(order.totalAmount);
      });

      const data = Object.values(groupedData).map(item => ({
        'Date': item.date,
        'Orders': item.orders,
        'Revenue': item.revenue.toFixed(2),
        'Average Order Value': (item.revenue / item.orders).toFixed(2)
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Set column widths
      const columnWidths = [
        { wch: 15 },  // Date
        { wch: 10 },  // Orders
        { wch: 12 },  // Revenue
        { wch: 18 }   // Average Order Value
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

      const fileName = `sales_report_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../../../uploads/exports', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      XLSX.writeFile(workbook, filePath);

      logger.info(`Sales report generated: ${fileName}`);
      return { fileName, filePath, count: data.length };
    } catch (error) {
      logger.error('Generate sales report error:', error);
      throw error;
    }
  }

  /**
   * Clean up old export files
   */
  async cleanupOldExports(daysToKeep = 7) {
    try {
      const exportsDir = path.join(__dirname, '../../../uploads/exports');
      const files = await fs.readdir(exportsDir);
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(exportsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} old export files`);
      return { deletedCount };
    } catch (error) {
      logger.error('Cleanup old exports error:', error);
      throw error;
    }
  }
}

module.exports = new ExcelService();
