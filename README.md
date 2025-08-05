# GameStore - E-commerce Application

A full-stack e-commerce platform for gaming products built with React, Express.js, and PostgreSQL.

## Tech Stack

### Backend
- Express.js
- PostgreSQL
- Sequelize ORM
- Redis (sessions & caching)
- JWT Authentication
- Passport.js (Google OAuth + Local)
- Stripe (payment processing)
- Joi (validation)
- Multer (file uploads)
- Winston (logging)

### Frontend
- React (TypeScript)
- Vite
- Tailwind CSS
- Shadcn UI
- Framer Motion
- React Router
- Axios
- Zustand (state management)
- React Hook Form
- React Query

## Project Structure

```
GameStore/
├── backend/                 # Express.js server
├── frontend/               # React application
├── docs/                   # Documentation
├── scripts/                # Database scripts & utilities
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis
- Stripe account (test mode)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

## Features

- User authentication (Admin/Buyer roles)
- Product management with categories/subcategories
- Shopping cart and checkout
- Stripe payment integration
- Stock management with detailed logs
- Reviews and ratings system
- Admin dashboard with analytics
- Image upload functionality
- Excel import for categories
- Search and filtering
- Order management
- Activity logging

## Demo Credentials

### Admin
- Email: admin@gamestore.com
- Password: admin123

### Buyer
- Email: buyer@gamestore.com
- Password: buyer123

## API Documentation

See `/docs/api.md` for detailed API endpoints.
