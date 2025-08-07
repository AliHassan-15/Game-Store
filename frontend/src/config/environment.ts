export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RsNgmKlxBQDt0jMq3e4koNq4L3WPHhmCFgiQhhogT5GEBoCXxaoFG3KDDfP46ai2h5Of7TcBqPsFrFFZzh40ruY00BdbtjuUv',
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
}

export default config 