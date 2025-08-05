/**
 * Application Constants
 */

// Environment
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  BUYER: 'buyer'
};

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
};

// Product Status
const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft'
};

// Order Status
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment Methods
const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer'
};

// Review Status
const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REPORTED: 'reported'
};

// File Upload
const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_EXCEL_TYPES: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_FILES_PER_UPLOAD: 5
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Rate Limiting
const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3 // limit each IP to 3 requests per windowMs
  },
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // limit each IP to 10 requests per windowMs
  },
  ORDER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20 // limit each IP to 20 requests per windowMs
  },
  REVIEW: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // limit each IP to 5 requests per windowMs
  },
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP to 200 requests per windowMs
  }
};

// JWT Configuration
const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  EMAIL_VERIFICATION_EXPIRY: '24h',
  PASSWORD_RESET_EXPIRY: '1h',
  ALGORITHM: 'HS256'
};

// Session Configuration
const SESSION = {
  SECRET: process.env.SESSION_SECRET || 'your-secret-key',
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  COOKIE_SECURE: process.env.NODE_ENV === 'production',
  COOKIE_HTTP_ONLY: true,
  COOKIE_SAME_SITE: 'lax',
  RESAVE: false,
  SAVE_UNINITIALIZED: false
};

// Redis Configuration
const REDIS = {
  SESSION_PREFIX: 'sess:',
  TOKEN_PREFIX: 'token:',
  CACHE_PREFIX: 'cache:',
  NOTIFICATION_PREFIX: 'notif:',
  RATE_LIMIT_PREFIX: 'ratelimit:',
  DEFAULT_TTL: 24 * 60 * 60, // 24 hours
  SESSION_TTL: 24 * 60 * 60, // 24 hours
  TOKEN_TTL: 7 * 24 * 60 * 60, // 7 days
  CACHE_TTL: 60 * 60, // 1 hour
  NOTIFICATION_TTL: 30 * 24 * 60 * 60 // 30 days
};

// Email Configuration
const EMAIL = {
  FROM_NAME: 'GameStore',
  FROM_EMAIL: process.env.SMTP_FROM || 'noreply@gamestore.com',
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@gamestore.com',
  VERIFICATION_SUBJECT: 'Verify Your Email Address',
  PASSWORD_RESET_SUBJECT: 'Reset Your Password',
  WELCOME_SUBJECT: 'Welcome to GameStore!',
  ORDER_CONFIRMATION_SUBJECT: 'Order Confirmation',
  ORDER_STATUS_UPDATE_SUBJECT: 'Order Status Update',
  SHIPPING_CONFIRMATION_SUBJECT: 'Your Order Has Been Shipped',
  DELIVERY_CONFIRMATION_SUBJECT: 'Your Order Has Been Delivered',
  REFUND_CONFIRMATION_SUBJECT: 'Refund Processed',
  LOW_STOCK_ALERT_SUBJECT: 'Low Stock Alert',
  OUT_OF_STOCK_ALERT_SUBJECT: 'Out of Stock Alert',
  NEW_REVIEW_SUBJECT: 'New Product Review',
  SECURITY_ALERT_SUBJECT: 'Security Alert'
};

// Stripe Configuration
const STRIPE = {
  CURRENCY: 'usd',
  PAYMENT_METHOD_TYPES: ['card'],
  SUPPORTED_CURRENCIES: ['usd', 'eur', 'gbp', 'cad', 'aud'],
  WEBHOOK_EVENTS: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'charge.refunded',
    'customer.created',
    'customer.updated',
    'customer.deleted'
  ]
};

// Validation Rules
const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  },
  EMAIL: {
    MAX_LENGTH: 255
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  PHONE: {
    MAX_LENGTH: 20
  },
  PRODUCT: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 2000,
    SKU_MIN_LENGTH: 3,
    SKU_MAX_LENGTH: 50,
    PRICE_MIN: 0,
    PRICE_MAX: 999999.99,
    STOCK_MIN: 0,
    STOCK_MAX: 999999
  },
  REVIEW: {
    TITLE_MIN_LENGTH: 5,
    TITLE_MAX_LENGTH: 200,
    COMMENT_MIN_LENGTH: 10,
    COMMENT_MAX_LENGTH: 1000,
    RATING_MIN: 1,
    RATING_MAX: 5
  },
  ADDRESS: {
    LINE_MAX_LENGTH: 200,
    CITY_MAX_LENGTH: 100,
    STATE_MAX_LENGTH: 100,
    COUNTRY_MAX_LENGTH: 100,
    POSTAL_CODE_MAX_LENGTH: 20
  }
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  INVALID_TOKEN: 'Invalid or expired token',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password is too weak',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',

  // Products
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_ALREADY_EXISTS: 'Product already exists',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  PRODUCT_INACTIVE: 'Product is inactive',

  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_ALREADY_PAID: 'Order is already paid',
  ORDER_CANNOT_BE_CANCELLED: 'Order cannot be cancelled',
  ORDER_CANNOT_BE_REFUNDED: 'Order cannot be refunded',

  // Cart
  CART_ITEM_NOT_FOUND: 'Cart item not found',
  CART_EMPTY: 'Cart is empty',
  INVALID_QUANTITY: 'Invalid quantity',

  // Reviews
  REVIEW_NOT_FOUND: 'Review not found',
  REVIEW_ALREADY_EXISTS: 'Review already exists',
  CANNOT_REVIEW_UNPURCHASED: 'Cannot review unpurchased product',

  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_ALREADY_EXISTS: 'Category already exists',
  CATEGORY_HAS_PRODUCTS: 'Category has products and cannot be deleted',

  // Files
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_NOT_FOUND: 'File not found',

  // Payment
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_INTENT_NOT_FOUND: 'Payment intent not found',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  REFUND_FAILED: 'Refund failed',

  // General
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded'
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  REGISTRATION_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  EMAIL_VERIFICATION_SENT: 'Email verification sent',
  EMAIL_VERIFIED: 'Email verified successfully',
  PROFILE_UPDATED: 'Profile updated successfully',

  // Products
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  PRODUCTS_EXPORTED: 'Products exported successfully',
  PRODUCTS_IMPORTED: 'Products imported successfully',

  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  ORDER_REFUNDED: 'Order refunded successfully',

  // Cart
  ITEM_ADDED_TO_CART: 'Item added to cart successfully',
  ITEM_UPDATED_IN_CART: 'Cart item updated successfully',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart successfully',
  CART_CLEARED: 'Cart cleared successfully',

  // Reviews
  REVIEW_CREATED: 'Review created successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted successfully',

  // Categories
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',

  // Files
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',

  // Payment
  PAYMENT_SUCCESS: 'Payment successful',
  REFUND_SUCCESS: 'Refund successful',

  // General
  OPERATION_SUCCESS: 'Operation completed successfully',
  DATA_EXPORTED: 'Data exported successfully',
  DATA_IMPORTED: 'Data imported successfully'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// API Response Codes
const API_CODES = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Cache Keys
const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  USERS: 'users',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  STATS: 'stats',
  CONFIG: 'config'
};

// File Paths
const PATHS = {
  UPLOADS: 'uploads',
  PRODUCTS: 'uploads/products',
  CATEGORIES: 'uploads/categories',
  USERS: 'uploads/users',
  DOCUMENTS: 'uploads/documents',
  EXPORTS: 'uploads/exports',
  TEMP: 'uploads/temp'
};

// Database
const DATABASE = {
  MAX_CONNECTIONS: 10,
  MIN_CONNECTIONS: 0,
  ACQUIRE_TIMEOUT: 60000,
  TIMEOUT: 60000,
  IDLE_TIMEOUT: 10000
};

// Security
const SECURITY = {
  BCRYPT_ROUNDS: 12,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_HISTORY_SIZE: 5,
  PASSWORD_EXPIRY_DAYS: 90
};

module.exports = {
  ENV,
  USER_ROLES,
  USER_STATUS,
  PRODUCT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  REVIEW_STATUS,
  UPLOAD,
  PAGINATION,
  RATE_LIMITS,
  JWT,
  SESSION,
  REDIS,
  EMAIL,
  STRIPE,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  API_CODES,
  CACHE_KEYS,
  PATHS,
  DATABASE,
  SECURITY
};
