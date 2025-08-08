const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Test configuration
const TEST_PORT = 5001;

// Basic CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser(process.env.SESSION_SECRET || 'test-secret'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Test routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication test server is running',
    timestamp: new Date().toISOString(),
    session: req.session ? 'Session exists' : 'No session',
    user: req.user ? req.user.email : 'No user',
    cookies: req.cookies ? Object.keys(req.cookies) : 'No cookies'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test authentication endpoints
app.post('/api/v1/auth/test-register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // Simulate user registration
  const user = {
    id: 'test-user-id',
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: 'buyer',
    isVerified: false,
    isActive: true
  };

  // Set session
  req.session.userId = user.id;
  req.session.user = user;

  res.json({
    success: true,
    message: 'Test registration successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      },
      session: req.session
    }
  });
});

app.post('/api/v1/auth/test-login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }

  // Simulate user login
  const user = {
    id: 'test-user-id',
    email: email.toLowerCase(),
    firstName: 'Test',
    lastName: 'User',
    role: 'buyer',
    isVerified: true,
    isActive: true
  };

  // Set session
  req.session.userId = user.id;
  req.session.user = user;

  res.json({
    success: true,
    message: 'Test login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      },
      session: req.session
    }
  });
});

app.get('/api/v1/auth/test-profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: req.session.user,
      session: req.session
    }
  });
});

app.post('/api/v1/auth/test-logout', (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    // Clear cookies
    res.clearCookie('connect.sid');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Test logout successful'
    });
  });
});

// Test JWT endpoints
app.post('/api/v1/auth/test-jwt-login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }

  // Simulate JWT token generation
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  
  const user = {
    id: 'test-user-id',
    email: email.toLowerCase(),
    firstName: 'Test',
    lastName: 'User',
    role: 'buyer',
    isVerified: true,
    isActive: true
  };

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, type: 'access' },
    secret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    secret,
    { expiresIn: '7d' }
  );

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    message: 'JWT login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

app.get('/api/v1/auth/test-jwt-profile', (req, res) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-jwt-secret';
    
    const decoded = jwt.verify(token, secret);
    
    const user = {
      id: decoded.userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: decoded.role,
      isVerified: true,
      isActive: true
    };

    res.json({
      success: true,
      message: 'JWT profile retrieved successfully',
      data: {
        user,
        token: decoded
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Test session info
app.get('/api/v1/auth/test-session', (req, res) => {
  res.json({
    success: true,
    message: 'Session info',
    data: {
      sessionId: req.sessionID,
      session: req.session,
      cookies: req.cookies,
      user: req.user || req.session?.user,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    }
  });
});

// Start server
app.listen(TEST_PORT, () => {
  console.log(`Authentication test server running on port ${TEST_PORT}`);
  console.log(`Test endpoints:`);
  console.log(`  GET  http://localhost:${TEST_PORT}/ - Server status`);
  console.log(`  GET  http://localhost:${TEST_PORT}/api/v1/health - Health check`);
  console.log(`  POST http://localhost:${TEST_PORT}/api/v1/auth/test-register - Test registration`);
  console.log(`  POST http://localhost:${TEST_PORT}/api/v1/auth/test-login - Test session login`);
  console.log(`  GET  http://localhost:${TEST_PORT}/api/v1/auth/test-profile - Test session profile`);
  console.log(`  POST http://localhost:${TEST_PORT}/api/v1/auth/test-logout - Test logout`);
  console.log(`  POST http://localhost:${TEST_PORT}/api/v1/auth/test-jwt-login - Test JWT login`);
  console.log(`  GET  http://localhost:${TEST_PORT}/api/v1/auth/test-jwt-profile - Test JWT profile`);
  console.log(`  GET  http://localhost:${TEST_PORT}/api/v1/auth/test-session - Test session info`);
}); 