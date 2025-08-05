# GameStore Backend API

A comprehensive e-commerce backend API built with Express.js, PostgreSQL, Sequelize, Redis, and Stripe integration.

## 🚀 Features

### Core Features
- **User Authentication**: JWT + Session + Google OAuth with Redis storage
- **Role-Based Access Control**: Admin and Buyer roles
- **Product Management**: Complete CRUD with categories and subcategories
- **Shopping Cart**: Full cart functionality with validation
- **Order Management**: Complete order lifecycle with status tracking
- **Payment Integration**: Stripe payment processing with webhooks
- **Stock Management**: Real-time inventory tracking with transaction logs
- **Reviews & Ratings**: Complete review system with moderation
- **Admin Dashboard**: Comprehensive analytics and management
- **File Upload**: Image and document upload with validation
- **Excel Import/Export**: Bulk data operations for all entities
- **Search & Filtering**: Advanced product discovery
- **Activity Logging**: Comprehensive system logs
- **Email Notifications**: Template-based email system

### Advanced Features
- **Rate Limiting**: Route-specific rate limiting with Redis
- **Security**: Helmet, CORS, input validation, JWT blacklisting
- **Logging**: Comprehensive logging with Winston
- **Error Handling**: Global error handling with custom error classes
- **Performance**: Compression, caching, database optimization
- **Monitoring**: Health checks, analytics, system monitoring
- **Background Processing**: Service-level cron jobs
- **Data Export**: Excel export for all entities
- **API Documentation**: Auto-generated documentation

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Cache**: Redis
- **Authentication**: JWT + Passport.js + Google OAuth
- **Payment**: Stripe
- **File Upload**: Multer
- **Validation**: Joi
- **Logging**: Winston
- **Email**: Nodemailer with Handlebars templates
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest, Supertest

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # Database configuration
│   ├── passport.js   # Passport authentication
│   ├── redis.js      # Redis configuration
│   └── stripe.js     # Stripe configuration
├── controllers/      # Route controllers
│   ├── auth/         # Authentication controllers
│   ├── admin/        # Admin dashboard controllers
│   ├── products/     # Product management
│   ├── cart/         # Shopping cart
│   ├── orders/       # Order management
│   ├── reviews/      # Reviews and ratings
│   ├── users/        # User management
│   ├── categories/   # Category management
│   ├── stripe/       # Payment processing
│   └── upload/       # File upload
├── middleware/       # Custom middleware
│   ├── auth/         # Authentication middleware
│   ├── validation/   # Request validation
│   ├── upload/       # File upload middleware
│   ├── cors.js       # CORS configuration
│   ├── errorHandler.js # Error handling
│   ├── logger.js     # Logging middleware
│   └── rateLimiter.js # Rate limiting
├── models/          # Database models
│   ├── User.js      # User model
│   ├── Product.js   # Product model
│   ├── Order.js     # Order model
│   ├── Cart.js      # Cart model
│   ├── Review.js    # Review model
│   └── index.js     # Model associations
├── routes/          # API routes
│   ├── auth/        # Authentication routes
│   ├── admin/       # Admin routes
│   ├── products/    # Product routes
│   ├── cart/        # Cart routes
│   ├── orders/      # Order routes
│   ├── reviews/     # Review routes
│   ├── users/       # User routes
│   ├── categories/  # Category routes
│   ├── stripe/      # Payment routes
│   ├── upload/      # Upload routes
│   └── index.js     # Main routes file
├── services/        # Business logic
│   ├── auth/        # Authentication service
│   ├── email/       # Email service
│   ├── payment/     # Payment service
│   ├── excel/       # Excel import/export
│   └── notification/ # Notification service
├── utils/           # Utility functions
│   ├── constants/   # Application constants
│   ├── helpers/     # Helper functions
│   ├── logger/      # Logging utilities
│   └── validators/  # Validation utilities
├── validators/      # Request validation schemas
└── server.js        # Main application file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- Redis
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameStore/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb gamestore
   
   # Run migrations (if using Sequelize CLI)
   npm run db:migrate
   
   # Or sync database in development
   npm run dev
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gamestore
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token
- `GET /auth/google` - Google OAuth login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/profile` - Get user profile

### Product Endpoints
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (Admin)
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)
- `GET /products/search` - Search products
- `POST /products/bulk-import` - Import products (Admin)
- `GET /products/export/excel` - Export products (Admin)

### Cart Endpoints
- `GET /cart` - Get user cart
- `POST /cart/add` - Add item to cart
- `PUT /cart/items/:itemId` - Update cart item
- `DELETE /cart/items/:itemId` - Remove cart item
- `DELETE /cart/clear` - Clear cart
- `GET /cart/summary` - Get cart summary

### Order Endpoints
- `POST /orders/create-from-cart` - Create order from cart
- `GET /orders/my-orders` - Get user orders
- `GET /orders/:orderId` - Get order details
- `POST /orders/:orderId/cancel` - Cancel order
- `GET /orders` - Get all orders (Admin)
- `PUT /orders/:orderId/status` - Update order status (Admin)

### Admin Endpoints
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - Get all users
- `GET /admin/products` - Get all products
- `GET /admin/orders` - Get all orders
- `GET /admin/analytics` - Get analytics
- `GET /admin/inventory` - Get inventory
- `GET /admin/activity-logs` - Get activity logs

### Payment Endpoints
- `POST /stripe/create-payment-intent` - Create payment intent
- `POST /stripe/confirm-payment` - Confirm payment
- `POST /stripe/webhook` - Stripe webhook

## 🔐 Authentication

### JWT + Session Hybrid
The API uses a hybrid authentication approach:
- **Session-based**: For web applications (Redis + cookies)
- **Token-based**: For mobile/SPA applications (JWT)

### Google OAuth
- Configure Google OAuth credentials
- Users can sign in with Google accounts
- Automatic account linking for existing users

### Role-Based Access Control
- **Admin**: Full access to all endpoints
- **Buyer**: Limited access to user-specific endpoints

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `products` - Product catalog
- `categories` - Product categories
- `sub_categories` - Product subcategories
- `orders` - Customer orders
- `order_items` - Order line items
- `cart_items` - Shopping cart items
- `reviews` - Product reviews
- `inventory_transactions` - Stock movement logs
- `user_addresses` - User shipping addresses
- `user_payments` - User payment methods
- `activity_logs` - System activity tracking

## 🛡 Security Features

- **Input Validation**: Joi schema validation
- **Rate Limiting**: Redis-based rate limiting
- **CORS**: Configurable CORS policies
- **Helmet**: Security headers
- **JWT Blacklisting**: Token invalidation
- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Protection**: Sequelize ORM
- **XSS Protection**: Input sanitization

## 📈 Monitoring & Logging

### Logging Levels
- **Error**: Application errors
- **Warn**: Warning messages
- **Info**: General information
- **Debug**: Debug information
- **HTTP**: HTTP request logs

### Log Files
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up CI/CD pipeline

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
REDIS_HOST=your_production_redis_host
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🎯 Roadmap

- [ ] GraphQL API
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile app API
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced caching strategies 