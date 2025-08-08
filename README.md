# 🎮 GameStore - E-commerce Platform

A full-stack e-commerce platform for selling video games, built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd GameStore

# Run the main setup script
node setup.js
```

### 2. Database Setup

Make sure PostgreSQL is running and create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE "gameStoreDb";

# Exit psql
\q
```

### 3. Backend Setup

```bash
cd backend

# Create .env file (if not already created by setup script)
cp env.example .env

# Update .env with your database credentials
# DB_USER=postgres
# DB_PASSWORD=your_password

# Setup database tables and seed data
npm run db:setup

# Start the development server
npm run dev
```

The backend will run on: http://localhost:5000

### 4. Frontend Setup

```bash
cd frontend

# Create .env file (if not already created by setup script)
# The setup script should have created this automatically

# Start the development server
npm run dev
```

The frontend will run on: http://localhost:5173

## 📁 Project Structure

```
GameStore/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── config/         # Configuration files
│   ├── scripts/            # Database scripts
│   └── uploads/            # File uploads
├── frontend/               # React/TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── store/          # State management
│   └── public/             # Static assets
└── README.md
```

## 🔧 Available Scripts

### Backend

```bash
cd backend

npm run dev          # Start development server
npm run start        # Start production server
npm run setup        # Setup backend dependencies
npm run db:setup     # Setup database and seed data
npm run test         # Run tests
```

### Frontend

```bash
cd frontend

npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run setup        # Setup frontend dependencies
npm run lint         # Run ESLint
```

## 🌟 Features

### User Features
- User registration and authentication
- Product browsing and search
- Shopping cart management
- Order placement and tracking
- Product reviews and ratings
- User profile management

### Admin Features
- Product management (CRUD)
- Category and subcategory management
- Order management
- User management
- Inventory tracking
- Sales analytics

### Technical Features
- JWT authentication
- File upload handling
- Payment integration (Stripe)
- Email notifications
- Rate limiting
- Input validation
- Error handling

## 🔐 Environment Variables

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gameStoreDb
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **Users** - User accounts and authentication
- **Categories** - Product categories
- **SubCategories** - Product subcategories
- **Products** - Product information
- **Orders** - Customer orders
- **OrderItems** - Individual items in orders
- **Reviews** - Product reviews
- **Carts** - Shopping cart data

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists: `gameStoreDb`

2. **Port Already in Use**
   - Backend: Change `PORT` in `.env`
   - Frontend: Vite will automatically use next available port

3. **CORS Errors**
   - Ensure backend is running on port 5000
   - Check CORS configuration in backend

4. **API 400 Errors**
   - Check if database is properly seeded
   - Verify API endpoints are working
   - Check browser console for specific error messages

### Reset Database

```bash
cd backend
npm run db:reset
```

## 📝 API Documentation

The API documentation is available at: http://localhost:5000/api-docs (when running)

### Main Endpoints

- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/featured` - Get featured products
- `GET /api/v1/products/on-sale` - Get products on sale
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the console errors
3. Ensure all prerequisites are installed
4. Verify database connection
5. Check environment variables

For additional help, please open an issue in the repository.
