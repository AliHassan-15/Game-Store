const jwt = require('jsonwebtoken');
const { redisUtils } = require('../../config/redis');
const logger = require('../../utils/logger/logger');

/**
 * JWT Middleware
 * Handles JWT token generation, verification, and management
 */

// Generate JWT token
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'gamestore',
    audience: process.env.JWT_AUDIENCE || 'gamestore-users'
  };

  const tokenOptions = { ...defaultOptions, ...options };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
    return { success: true, token };
  } catch (error) {
    logger.error('JWT token generation error:', error);
    return { success: false, error: error.message };
  }
};

// Generate access token
const generateAccessToken = (userId, role) => {
  const payload = {
    userId,
    role,
    type: 'access'
  };

  return generateToken(payload, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh'
  };

  return generateToken(payload, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Generate email verification token
const generateEmailVerificationToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'email_verification'
  };

  return generateToken(payload, {
    expiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN || '24h'
  });
};

// Generate password reset token
const generatePasswordResetToken = (userId, email) => {
  const payload = {
    userId,
    email,
    type: 'password_reset'
  };

  return generateToken(payload, {
    expiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '1h'
  });
};

// Verify JWT token
const verifyToken = (token, options = {}) => {
  const defaultOptions = {
    issuer: process.env.JWT_ISSUER || 'gamestore',
    audience: process.env.JWT_AUDIENCE || 'gamestore-users'
  };

  const verifyOptions = { ...defaultOptions, ...options };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
    return { success: true, decoded };
  } catch (error) {
    logger.error('JWT token verification error:', error);
    return { success: false, error: error.message };
  }
};

// Decode JWT token without verification
const decodeToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return { success: true, decoded };
  } catch (error) {
    logger.error('JWT token decode error:', error);
    return { success: false, error: error.message };
  }
};

// Blacklist token (for logout)
const blacklistToken = async (token, expiresIn = '7d') => {
  try {
    const { success, decoded } = decodeToken(token);
    if (!success) {
      return { success: false, error: 'Invalid token' };
    }

    // Calculate remaining time
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp || now;
    const remainingTime = Math.max(0, exp - now);

    // Store in Redis blacklist
    await redisUtils.setEx(
      `blacklist:${token}`,
      remainingTime,
      JSON.stringify({ userId: decoded.userId, type: decoded.type })
    );

    logger.info(`Token blacklisted for user: ${decoded.userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Token blacklist error:', error);
    return { success: false, error: error.message };
  }
};

// Check if token is blacklisted
const isTokenBlacklisted = async (token) => {
  try {
    const exists = await redisUtils.keyExists(`blacklist:${token}`);
    return { success: true, blacklisted: exists };
  } catch (error) {
    logger.error('Token blacklist check error:', error);
    return { success: false, error: error.message };
  }
};

// Refresh token middleware
const refreshToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const { success, decoded, error } = verifyToken(refreshToken);
    if (!success) {
      return { success: false, error };
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      return { success: false, error: 'Invalid token type' };
    }

    // Check if token is blacklisted
    const { blacklisted } = await isTokenBlacklisted(refreshToken);
    if (blacklisted) {
      return { success: false, error: 'Token has been invalidated' };
    }

    // Generate new access token
    const { User } = require('../../models');
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive' };
    }

    const { token: newAccessToken } = generateAccessToken(user.id, user.role);

    // Blacklist old refresh token
    await blacklistToken(refreshToken);

    // Generate new refresh token
    const { token: newRefreshToken } = generateRefreshToken(user.id);

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    return { success: false, error: error.message };
  }
};

// Token validation middleware
const validateToken = (tokenType = 'access') => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token required'
      });
    }

    const { success, decoded, error } = verifyToken(token);
    if (!success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Check token type
    if (decoded.type !== tokenType) {
      return res.status(401).json({
        success: false,
        message: `Invalid token type. Expected: ${tokenType}`
      });
    }

    req.tokenData = decoded;
    next();
  };
};

// Token expiration middleware
const checkTokenExpiration = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

  if (!token) {
    return next();
  }

  const { success, decoded } = decodeToken(token);
  if (!success) {
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = decoded.exp || 0;
  const timeUntilExpiry = exp - now;

  // If token expires in less than 5 minutes, add warning header
  if (timeUntilExpiry > 0 && timeUntilExpiry < 300) {
    res.set('X-Token-Expiry-Warning', `Token expires in ${Math.ceil(timeUntilExpiry / 60)} minutes`);
  }

  next();
};

// Token cleanup middleware (clean up expired blacklisted tokens)
const cleanupExpiredTokens = async () => {
  try {
    const keys = await redisUtils.keys('blacklist:*');
    let cleanedCount = 0;

    for (const key of keys) {
      const ttl = await redisUtils.getTTL(key);
      if (ttl <= 0) {
        await redisUtils.del(key);
        cleanedCount++;
      }
    }

    logger.info(`Cleaned up ${cleanedCount} expired blacklisted tokens`);
    return { success: true, cleanedCount };
  } catch (error) {
    logger.error('Token cleanup error:', error);
    return { success: false, error: error.message };
  }
};

// Get token information
const getTokenInfo = (token) => {
  try {
    const { success, decoded } = decodeToken(token);
    if (!success) {
      return { success: false, error: 'Invalid token' };
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp || 0;
    const iat = decoded.iat || 0;

    return {
      success: true,
      info: {
        userId: decoded.userId,
        type: decoded.type,
        role: decoded.role,
        issuedAt: new Date(iat * 1000),
        expiresAt: new Date(exp * 1000),
        isExpired: now > exp,
        timeUntilExpiry: Math.max(0, exp - now),
        issuer: decoded.iss,
        audience: decoded.aud
      }
    };
  } catch (error) {
    logger.error('Get token info error:', error);
    return { success: false, error: error.message };
  }
};

// Set authentication cookies
const setAuthCookies = (res, accessToken, refreshToken, options = {}) => {
  const {
    httpOnly = true,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax',
    maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
  } = options;

  // Set access token cookie (short-lived)
  res.cookie('accessToken', accessToken, {
    httpOnly,
    secure,
    sameSite,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  });

  // Set refresh token cookie (long-lived)
  res.cookie('refreshToken', refreshToken, {
    httpOnly,
    secure,
    sameSite,
    maxAge,
    path: '/'
  });
};

// Clear authentication cookies
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('connect.sid', { path: '/' });
};

// Store session in Redis
const storeSession = async (userId, sessionData, expiresIn = 24 * 60 * 60) => {
  try {
    await redisUtils.setEx(
      `session:${userId}`,
      expiresIn,
      JSON.stringify(sessionData)
    );
    return { success: true };
  } catch (error) {
    logger.error('Store session error:', error);
    return { success: false, error: error.message };
  }
};

// Get session from Redis
const getSession = async (userId) => {
  try {
    const session = await redisUtils.get(`session:${userId}`);
    return { success: true, session: session ? JSON.parse(session) : null };
  } catch (error) {
    logger.error('Get session error:', error);
    return { success: false, error: error.message };
  }
};

// Delete session from Redis
const deleteSession = async (userId) => {
  try {
    await redisUtils.del(`session:${userId}`);
    return { success: true };
  } catch (error) {
    logger.error('Delete session error:', error);
    return { success: false, error: error.message };
  }
};

// Generate authentication tokens and set cookies
const generateAuthTokens = async (userId, role, res, options = {}) => {
  try {
    // Generate tokens
    const { token: accessToken } = generateAccessToken(userId, role);
    const { token: refreshToken } = generateRefreshToken(userId);

    // Store session in Redis
    const sessionData = {
      userId,
      role,
      accessToken,
      refreshToken,
      createdAt: new Date().toISOString()
    };

    await storeSession(userId, sessionData);

    // Set cookies if response object is provided
    if (res) {
      setAuthCookies(res, accessToken, refreshToken, options);
    }

    return {
      success: true,
      accessToken,
      refreshToken,
      sessionData
    };
  } catch (error) {
    logger.error('Generate auth tokens error:', error);
    return { success: false, error: error.message };
  }
};

// Validate and refresh tokens if needed
const validateAndRefreshTokens = async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken) {
      return { success: false, error: 'No access token provided' };
    }

    // Verify access token
    const { success: accessValid, decoded: accessDecoded } = verifyToken(accessToken);
    
    if (accessValid) {
      return { success: true, accessToken, user: accessDecoded };
    }

    // Access token is invalid, try refresh token
    if (!refreshToken) {
      return { success: false, error: 'No refresh token provided' };
    }

    const { success: refreshValid, decoded: refreshDecoded } = verifyToken(refreshToken);
    
    if (!refreshValid) {
      return { success: false, error: 'Invalid refresh token' };
    }

    // Check if refresh token is blacklisted
    const { blacklisted } = await isTokenBlacklisted(refreshToken);
    if (blacklisted) {
      return { success: false, error: 'Refresh token has been invalidated' };
    }

    // Generate new tokens
    const { User } = require('../../models');
    const user = await User.findByPk(refreshDecoded.userId);
    
    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive' };
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
      await generateAuthTokens(user.id, user.role, res);

    // Blacklist old refresh token
    await blacklistToken(refreshToken);

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { userId: user.id, role: user.role }
    };
  } catch (error) {
    logger.error('Validate and refresh tokens error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
  decodeToken,
  blacklistToken,
  isTokenBlacklisted,
  refreshToken,
  validateToken,
  checkTokenExpiration,
  cleanupExpiredTokens,
  getTokenInfo,
  setAuthCookies,
  clearAuthCookies,
  storeSession,
  getSession,
  deleteSession,
  generateAuthTokens,
  validateAndRefreshTokens
};
