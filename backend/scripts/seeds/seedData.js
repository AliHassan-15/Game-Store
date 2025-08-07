const bcrypt = require('bcryptjs');
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

async function seed() {
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
    ]);

    // Create SubCategories
    const subCategories = await SubCategory.bulkCreate([
      {
        name: 'First-Person Shooter',
        description: 'FPS games with immersive combat',
        slug: 'first-person-shooter',
        categoryId: categories[0].id,
        isActive: true
      },
      {
        name: 'Open World RPG',
        description: 'Open world role-playing games',
        slug: 'open-world-rpg',
        categoryId: categories[1].id,
        isActive: true
      },
      {
        name: 'Real-Time Strategy',
        description: 'RTS games requiring quick thinking',
        slug: 'real-time-strategy',
        categoryId: categories[2].id,
        isActive: true
      },
      {
        name: 'Football Games',
        description: 'Soccer and football simulation games',
        slug: 'football-games',
        categoryId: categories[3].id,
        isActive: true
      }
    ]);

    // Create Users
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
    ]);

    // Create Products
    const products = await Product.bulkCreate([
      {
        name: 'Call of Duty: Modern Warfare',
        description: 'Intense first-person shooter with modern combat',
        slug: 'call-of-duty-modern-warfare',
        price: 59.99,
        originalPrice: 69.99,
        stockQuantity: 100,
        categoryId: categories[0].id,
        subCategoryId: subCategories[0].id,
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
        price: 39.99,
        originalPrice: 59.99,
        stockQuantity: 75,
        categoryId: categories[1].id,
        subCategoryId: subCategories[1].id,
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
        price: 29.99,
        originalPrice: 39.99,
        stockQuantity: 50,
        categoryId: categories[2].id,
        subCategoryId: subCategories[2].id,
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
        price: 69.99,
        originalPrice: 69.99,
        stockQuantity: 200,
        categoryId: categories[3].id,
        subCategoryId: subCategories[3].id,
        platform: 'PC',
        genre: 'Sports',
        publisher: 'EA Sports',
        developer: 'EA Sports',
        releaseDate: '2023-09-29',
        isOnSale: false,
        isFeatured: true,
        isActive: true
      }
    ]);

    // Create User Addresses
    await UserAddress.bulkCreate([
      {
        userId: users[0].id,
        type: 'shipping',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        phone: '+1234567890',
        isDefault: true
      },
      {
        userId: users[0].id,
        type: 'billing',
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        phone: '+1234567890',
        isDefault: true
      }
    ]);

    // Create User Payment Methods
    await UserPayment.bulkCreate([
      {
        userId: users[0].id,
        type: 'card',
        provider: 'Visa',
        last4: '1234',
        brand: 'Visa',
        expMonth: 12,
        expYear: 2025,
        isDefault: true,
        isActive: true
      }
    ]);

    // Create Reviews
    await Review.bulkCreate([
      {
        userId: users[0].id,
        productId: products[0].id,
        rating: 5,
        title: 'Amazing Game!',
        comment: 'This is one of the best FPS games I have ever played. Highly recommended!',
        isVerified: true,
        isActive: true
      },
      {
        userId: users[1].id,
        productId: products[1].id,
        rating: 5,
        title: 'Masterpiece RPG',
        comment: 'The Witcher 3 is a masterpiece. The story, graphics, and gameplay are all exceptional.',
        isVerified: true,
        isActive: true
      }
    ]);

    // Create Inventory Transactions
    await InventoryTransaction.bulkCreate([
      {
        productId: products[0].id,
        type: 'in',
        quantity: 100,
        reason: 'Initial stock',
        reference: 'INIT-001',
        notes: 'Initial inventory setup'
      },
      {
        productId: products[1].id,
        type: 'in',
        quantity: 75,
        reason: 'Initial stock',
        reference: 'INIT-002',
        notes: 'Initial inventory setup'
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created: ${categories.length} categories, ${subCategories.length} subcategories, ${users.length} users, ${products.length} products`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

module.exports = { seed };
