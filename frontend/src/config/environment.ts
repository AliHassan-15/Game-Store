export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    timeout: 10000,
  },

  // App Configuration
  app: {
    name: 'GameStore',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },

  // Authentication Configuration
  auth: {
    tokenKey: 'accessToken',
    refreshTokenKey: 'refreshToken',
    tokenExpiryCheckInterval: 60000, // 1 minute
    tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes
  },

  // Stripe Configuration
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },

  // Feature Flags
  features: {
    googleAuth: true,
    emailVerification: true,
    passwordReset: true,
    adminDashboard: true,
    analytics: true,
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '#4F46E5',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    animations: {
      duration: 300,
      easing: 'ease-in-out',
    },
  },

  // Pagination Configuration
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
}

export default config 