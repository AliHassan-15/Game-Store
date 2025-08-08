# GameStore Authentication System

## Overview

The GameStore authentication system implements a hybrid approach combining:
- **Session-based authentication** (for web applications)
- **JWT token authentication** (for API clients)
- **Google OAuth 2.0** (social login)
- **Redis session storage** (for scalability)

## Features

### ✅ Implemented Features

1. **Local Authentication**
   - User registration with email verification
   - Password-based login with bcrypt hashing
   - Password reset functionality
   - Email verification system

2. **Google OAuth 2.0**
   - Google sign-in integration
   - Automatic account linking
   - Profile data synchronization

3. **Session Management**
   - Redis-based session storage
   - Secure session cookies
   - Session cleanup and monitoring

4. **JWT Token System**
   - Access tokens (15 minutes)
   - Refresh tokens (7 days)
   - Token blacklisting for logout
   - Automatic token refresh

5. **Security Features**
   - CSRF protection
   - Rate limiting
   - Password strength validation
   - Account lockout protection

## Architecture

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │    Redis    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Login Request  │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │ 2. Verify User    │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │ 3. Generate Tokens│
       │                   │                   │
       │                   │ 4. Store Session  │
       │                   │──────────────────▶│
       │                   │                   │
       │ 5. Return Tokens  │                   │
       │◀──────────────────│                   │
       │                   │                   │
```

### File Structure

```
backend/src/
├── config/
│   ├── auth.js              # Authentication configuration
│   ├── passport.js          # Passport strategies
│   └── redis.js             # Redis configuration
├── controllers/auth/
│   └── authController.js    # Authentication endpoints
├── middleware/auth/
│   ├── authMiddleware.js    # Authentication middleware
│   └── jwtMiddleware.js     # JWT token management
├── models/
│   └── User.js              # User model with auth methods
└── routes/auth/
    └── authRoutes.js        # Authentication routes
```

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_EMAIL_VERIFICATION_EXPIRES_IN=24h
JWT_PASSWORD_RESET_EXPIRES_IN=1h

# Session Configuration
SESSION_SECRET=your-session-secret
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTP_ONLY=true
SESSION_COOKIE_SAME_SITE=lax
SESSION_COOKIE_MAX_AGE=86400000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
BCRYPT_SALT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | User registration | No |
| POST | `/api/v1/auth/login` | Local login | No |
| GET | `/api/v1/auth/google` | Google OAuth login | No |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback | No |
| POST | `/api/v1/auth/refresh` | Refresh JWT token | No |
| POST | `/api/v1/auth/logout` | Logout user | Yes |
| GET | `/api/v1/auth/profile` | Get user profile | Yes |
| PUT | `/api/v1/auth/profile` | Update user profile | Yes |
| PUT | `/api/v1/auth/change-password` | Change password | Yes |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |
| POST | `/api/v1/auth/verify-email` | Verify email | No |
| GET | `/api/v1/auth/check` | Check authentication status | Yes |

### Request/Response Examples

#### Registration

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+1234567890"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isVerified": false
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here"
    }
  }
}
```

#### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isVerified": true,
      "avatar": "https://example.com/avatar.jpg"
    },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here"
    }
  }
}
```

## Authentication Methods

### 1. Session-Based Authentication

For web applications, the system uses session-based authentication with Redis storage:

```javascript
// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
```

### 2. JWT Token Authentication

For API clients, the system uses JWT tokens:

```javascript
// Token structure
const accessToken = {
  userId: "user_id",
  role: "buyer",
  type: "access",
  exp: "expiration_time"
};

const refreshToken = {
  userId: "user_id",
  type: "refresh",
  exp: "expiration_time"
};
```

### 3. Google OAuth 2.0

Google OAuth integration for social login:

```javascript
// Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (req, accessToken, refreshToken, profile, done) => {
  // Handle Google authentication
}));
```

## Security Features

### 1. Password Security

- **bcrypt hashing** with configurable salt rounds
- **Password strength validation**
- **Minimum/maximum length requirements**

```javascript
// Password hashing in User model
beforeCreate: async (user) => {
  if (user.password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
}
```

### 2. Token Security

- **Short-lived access tokens** (15 minutes)
- **Long-lived refresh tokens** (7 days)
- **Token blacklisting** for logout
- **Automatic token refresh**

### 3. Session Security

- **HttpOnly cookies** (prevents XSS)
- **Secure cookies** in production
- **SameSite attribute** (prevents CSRF)
- **Redis session storage** (scalable)

### 4. Rate Limiting

```javascript
// Rate limiting by user role
const rateLimitByRole = (options = {}) => {
  return (req, res, next) => {
    const limits = {
      guest: options.guest || 10,
      buyer: options.buyer || 100,
      admin: options.admin || 1000
    };
    // Apply rate limiting logic
  };
};
```

## Testing

### Test Server

Run the authentication test server:

```bash
node test-auth.js
```

This starts a test server on port 5001 with endpoints to test:
- Session-based authentication
- JWT token authentication
- Cookie handling
- Session management

### Test Endpoints

- `GET /` - Server status
- `POST /api/v1/auth/test-register` - Test registration
- `POST /api/v1/auth/test-login` - Test session login
- `GET /api/v1/auth/test-profile` - Test session profile
- `POST /api/v1/auth/test-logout` - Test logout
- `POST /api/v1/auth/test-jwt-login` - Test JWT login
- `GET /api/v1/auth/test-jwt-profile` - Test JWT profile
- `GET /api/v1/auth/test-session` - Test session info

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify Redis configuration in environment variables
   - In development, the system continues without Redis

2. **Session Not Persisting**
   - Check cookie settings (httpOnly, secure, sameSite)
   - Verify session store configuration
   - Check Redis connection

3. **JWT Token Invalid**
   - Verify JWT_SECRET environment variable
   - Check token expiration
   - Ensure token is not blacklisted

4. **Google OAuth Not Working**
   - Verify Google OAuth credentials
   - Check callback URL configuration
   - Ensure redirect URIs are configured in Google Console

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug
DEBUG=true
```

## Best Practices

1. **Environment Variables**
   - Use strong, unique secrets for JWT and sessions
   - Never commit secrets to version control
   - Use different secrets for different environments

2. **Security Headers**
   - Implement proper CORS configuration
   - Use security headers (helmet.js)
   - Enable HTTPS in production

3. **Token Management**
   - Implement token refresh logic
   - Blacklist tokens on logout
   - Monitor token usage and expiration

4. **Session Management**
   - Regular session cleanup
   - Monitor session storage usage
   - Implement session timeout

5. **Error Handling**
   - Don't expose sensitive information in error messages
   - Log authentication failures for monitoring
   - Implement proper error responses

## Monitoring

### Session Monitoring

```javascript
// Get session statistics
const { getSessionStats } = require('./config/auth');
const stats = await getSessionStats();
console.log(stats);
```

### Token Monitoring

```javascript
// Get token information
const { getTokenInfo } = require('./middleware/auth/jwtMiddleware');
const tokenInfo = getTokenInfo(token);
console.log(tokenInfo);
```

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - SMS-based verification
   - TOTP (Time-based One-Time Password)
   - Hardware security keys

2. **Advanced Security**
   - Device fingerprinting
   - Location-based authentication
   - Behavioral analysis

3. **Social Login Expansion**
   - Facebook OAuth
   - Twitter OAuth
   - GitHub OAuth

4. **Session Management**
   - Concurrent session limits
   - Device management
   - Session analytics 