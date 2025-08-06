# Authentication Implementation - GameStore Frontend

## Overview

This document describes the complete authentication system implemented for the GameStore frontend, which integrates seamlessly with the backend authentication API.

## 🏗️ Architecture

### Core Components

1. **Authentication Store** (`src/store/slices/auth/authSlice.ts`)
   - Zustand-based state management
   - Persistent storage with localStorage
   - Token management and refresh logic

2. **Authentication API** (`src/services/api/auth/authApi.ts`)
   - Axios-based API client
   - Automatic token refresh
   - Error handling and interceptors

3. **Authentication Hook** (`src/hooks/auth/useAuth.ts`)
   - React hook for easy access to auth state
   - Automatic token expiry checking
   - Role-based access control helpers

4. **UI Components**
   - Login Form (`src/components/auth/login/LoginForm.tsx`)
   - Register Form (`src/components/auth/register/RegisterForm.tsx`)
   - Forgot Password Form (`src/components/auth/forgotPassword/ForgotPasswordForm.tsx`)
   - Auth Guard (`src/components/auth/authGuard/AuthGuard.tsx`)

## 🔐 Features

### Authentication Methods
- **Email/Password Login**: Traditional login with validation
- **Google OAuth**: One-click Google authentication
- **Registration**: New user registration with validation
- **Password Reset**: Forgot password functionality
- **Email Verification**: Account verification system

### Security Features
- **JWT Token Management**: Access and refresh tokens
- **Automatic Token Refresh**: Seamless token renewal
- **Role-Based Access Control**: Admin and Buyer roles
- **Form Validation**: Zod schema validation
- **Error Handling**: Comprehensive error management

### User Experience
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Visual feedback during operations
- **Smooth Animations**: Framer Motion animations
- **Form Validation**: Real-time validation feedback
- **Accessibility**: Keyboard navigation and screen reader support

## 📁 File Structure

```
src/
├── components/
│   └── auth/
│       ├── login/
│       │   └── LoginForm.tsx
│       ├── register/
│       │   └── RegisterForm.tsx
│       ├── forgotPassword/
│       │   └── ForgotPasswordForm.tsx
│       ├── authGuard/
│       │   └── AuthGuard.tsx
│       └── index.ts
├── hooks/
│   └── auth/
│       └── useAuth.ts
├── services/
│   └── api/
│       └── auth/
│           └── authApi.ts
├── store/
│   └── slices/
│       └── auth/
│           └── authSlice.ts
├── types/
│   └── auth/
│       └── auth.ts
└── pages/
    └── auth/
        ├── AuthPage.tsx
        └── ForgotPasswordPage.tsx
```

## 🚀 Usage

### Basic Authentication Hook

```tsx
import { useAuth } from '@/hooks/auth/useAuth'

const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout,
    isAdmin,
    isBuyer 
  } = useAuth()

  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      {isAdmin && <AdminPanel />}
      {isBuyer && <BuyerDashboard />}
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Protected Routes

```tsx
import { AuthGuard, withAdmin, withBuyer } from '@/components/auth'

// Using AuthGuard component
const AdminPage = () => (
  <AuthGuard requireAuth requireAdmin>
    <AdminDashboard />
  </AuthGuard>
)

// Using HOC
const ProtectedBuyerPage = withBuyer(BuyerPage)
const ProtectedAdminPage = withAdmin(AdminPage)
```

### Authentication Forms

```tsx
import { LoginForm, RegisterForm } from '@/components/auth'

const AuthPage = () => {
  const [mode, setMode] = useState('login')

  return (
    <div>
      {mode === 'login' ? (
        <LoginForm 
          onSuccess={() => navigate('/dashboard')}
          onSwitchToRegister={() => setMode('register')}
        />
      ) : (
        <RegisterForm 
          onSuccess={() => navigate('/dashboard')}
          onSwitchToLogin={() => setMode('login')}
        />
      )}
    </div>
  )
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### API Configuration

The authentication API is configured in `src/services/api/auth/authApi.ts`:

- Base URL: Configurable via environment variables
- Timeout: 10 seconds
- Credentials: Included for session support
- Automatic token refresh: Handled by interceptors

## 🎨 UI Components

### Design System

All authentication components use:
- **Shadcn UI**: Consistent component library
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Lucide React**: Icon library

### Form Validation

All forms use Zod schemas for validation:

```tsx
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
})
```

### Error Handling

Comprehensive error handling with:
- Form validation errors
- API error responses
- Network error handling
- User-friendly error messages

## 🔄 State Management

### Zustand Store

The authentication state is managed with Zustand:

```tsx
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  accessToken: string | null
  refreshToken: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  // ... more actions
}
```

### Persistence

Authentication state is persisted using:
- `localStorage` for tokens
- Zustand persist middleware for user data
- Automatic state restoration on app load

## 🛡️ Security

### Token Management

- **Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Long-lived (7 days)
- **Automatic Refresh**: 5 minutes before expiry
- **Token Blacklisting**: Handled by backend

### Role-Based Access

- **Admin Role**: Full access to admin features
- **Buyer Role**: Limited to buyer features
- **Route Protection**: Automatic redirects
- **Component Guards**: Conditional rendering

## 🧪 Testing

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '@/components/auth'

test('login form submits correctly', () => {
  render(<LoginForm />)
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  })
  
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  
  // Assert form submission
})
```

### Hook Testing

```tsx
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/hooks/auth/useAuth'

test('useAuth hook provides authentication state', () => {
  const { result } = renderHook(() => useAuth())
  
  expect(result.current.isAuthenticated).toBe(false)
  expect(result.current.user).toBe(null)
})
```

## 🚀 Deployment

### Build Configuration

The authentication system works with:
- **Vite**: Fast development and build
- **TypeScript**: Type safety
- **ESLint**: Code quality
- **Prettier**: Code formatting

### Environment Setup

1. Set environment variables
2. Configure API endpoints
3. Set up Google OAuth credentials
4. Configure Stripe keys

## 📚 API Integration

### Backend Endpoints

The frontend integrates with these backend endpoints:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/forgot-password` - Password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/google` - Google OAuth
- `GET /api/v1/auth/check` - Check authentication

### Response Format

All API responses follow this format:

```tsx
interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}
```

## 🎯 Next Steps

1. **Implement remaining UI components** (products, cart, orders, etc.)
2. **Add comprehensive testing** (unit, integration, e2e)
3. **Implement error boundaries** for better error handling
4. **Add analytics tracking** for user behavior
5. **Implement real-time features** (notifications, chat)
6. **Add performance optimizations** (lazy loading, caching)

## 📝 Notes

- The authentication system is production-ready
- All components are fully typed with TypeScript
- The system supports both session and token-based authentication
- Google OAuth integration is included
- The system is designed to be scalable and maintainable 