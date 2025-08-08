const { sequelize } = require('../../src/config/database');
const { 
  User, 
  Category, 
  SubCategory, 
  Product, 
  Cart, 
  CartItem, 
  Order, 
  OrderItem, 
  Review, 
  InventoryTransaction, 
  UserAddress, 
  UserPayment, 
  ActivityLog 
} = require('../../src/models');

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create Categories
    const categories = await Category.bulkCreate([
      {
        name: 'Action Games',
        description: 'Fast-paced action and adventure games',
        slug: 'action-games',
        isActive: true
      },
      {
        name: 'RPG Games',
        description: 'Role-playing games with deep storylines',
        slug: 'rpg-games',
        isActive: true
      },
      {
        name: 'Strategy Games',
        description: 'Strategic thinking and planning games',
        slug: 'strategy-games',
        isActive: true
      },
      {
        name: 'Sports Games',
        description: 'Sports and athletic simulation games',
        slug: 'sports-games',
        isActive: true
      }
    ], { ignoreDuplicates: true });

    // Get the created categories to use their IDs
    const actionCategory = await Category.findOne({ where: { slug: 'action-games' } });
    const rpgCategory = await Category.findOne({ where: { slug: 'rpg-games' } });
    const strategyCategory = await Category.findOne({ where: { slug: 'strategy-games' } });
    const sportsCategory = await Category.findOne({ where: { slug: 'sports-games' } });

    // Create SubCategories
    const subCategories = await SubCategory.bulkCreate([
      {
        name: 'First-Person Shooter',
        description: 'FPS games with immersive combat',
        slug: 'first-person-shooter',
        categoryId: actionCategory.id,
        isActive: true
      },
      {
        name: 'Open World RPG',
        description: 'Open world role-playing games',
        slug: 'open-world-rpg',
        categoryId: rpgCategory.id,
        isActive: true
      },
      {
        name: 'Real-Time Strategy',
        description: 'RTS games requiring quick thinking',
        slug: 'real-time-strategy',
        categoryId: strategyCategory.id,
        isActive: true
      },
      {
        name: 'Football Games',
        description: 'Soccer and football simulation games',
        slug: 'football-games',
        categoryId: sportsCategory.id,
        isActive: true
      }
    ], { ignoreDuplicates: true });

    // Create Users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const users = await User.bulkCreate([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        phone: '+1234567890',
        role: 'buyer',
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        phone: '+1234567891',
        role: 'buyer',
        isVerified: true,
        isActive: true
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@gamestore.com',
        password: hashedPassword,
        phone: '+1234567892',
        role: 'admin',
        isVerified: true,
        isActive: true
      }
    ], { ignoreDuplicates: true });

    // Get the created subcategories to use their IDs
    const fpsSubCategory = await SubCategory.findOne({ where: { slug: 'first-person-shooter' } });
    const rpgSubCategory = await SubCategory.findOne({ where: { slug: 'open-world-rpg' } });
    const rtsSubCategory = await SubCategory.findOne({ where: { slug: 'real-time-strategy' } });
    const footballSubCategory = await SubCategory.findOne({ where: { slug: 'football-games' } });

    // Create Products
    const products = await Product.bulkCreate([
      {
        name: 'Call of Duty: Modern Warfare',
        description: 'Intense first-person shooter with modern combat',
        slug: 'call-of-duty-modern-warfare',
        sku: 'COD-MW-001',
        price: 59.99,
        comparePrice: 69.99,
        stockQuantity: 100,
        categoryId: actionCategory.id,
        subCategoryId: fpsSubCategory.id,
        platform: 'PC',
        genre: 'FPS',
        publisher: 'Activision',
        developer: 'Infinity Ward',
        releaseDate: '2019-10-25',
        isOnSale: true,
        isFeatured: true,
        isActive: true
      },
      {
        name: 'The Witcher 3: Wild Hunt',
        description: 'Epic open-world RPG with rich storytelling',
        slug: 'the-witcher-3-wild-hunt',
        sku: 'WITCHER3-001',
        price: 39.99,
        comparePrice: 59.99,
        stockQuantity: 75,
        categoryId: rpgCategory.id,
        subCategoryId: rpgSubCategory.id,
        platform: 'PC',
        genre: 'RPG',
        publisher: 'CD Projekt',
        developer: 'CD Projekt Red',
        releaseDate: '2015-05-19',
        isOnSale: true,
        isFeatured: true,
        isActive: true
      },
      {
        name: 'StarCraft II: Wings of Liberty',
        description: 'Classic real-time strategy game',
        slug: 'starcraft-ii-wings-of-liberty',
        sku: 'SC2-WOL-001',
        price: 29.99,
        comparePrice: 39.99,
        stockQuantity: 50,
        categoryId: strategyCategory.id,
        subCategoryId: rtsSubCategory.id,
        platform: 'PC',
        genre: 'RTS',
        publisher: 'Blizzard Entertainment',
        developer: 'Blizzard Entertainment',
        releaseDate: '2010-07-27',
        isOnSale: false,
        isFeatured: false,
        isActive: true
      },
      {
        name: 'FIFA 24',
        description: 'Latest football simulation game',
        slug: 'fifa-24',
        sku: 'FIFA24-001',
        price: 69.99,
        comparePrice: 69.99,
        stockQuantity: 200,
        categoryId: sportsCategory.id,
        subCategoryId: footballSubCategory.id,
        platform: 'PC',
        genre: 'Sports',
        publisher: 'EA Sports',
        developer: 'EA Sports',
        releaseDate: '2023-09-29',
        isOnSale: false,
        isFeatured: true,
        isActive: true
      }
    ], { ignoreDuplicates: true });

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created: ${categories.length} categories, ${subCategories.length} subcategories, ${users.length} users, ${products.length} products`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

module.exports = seedData;
