import axios from 'axios'
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
  ProfileUpdateData,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData,
  User
} from '@/types/auth/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance with base configuration
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
})

// Request interceptor to add auth token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await authApi.post('/refresh', {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return authApi(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await authApi.post('/register', data)
    return response.data
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authApi.post('/login', credentials)
    return response.data
  },

  // Google OAuth login
  async googleLogin(): Promise<void> {
    window.location.href = `${API_BASE_URL}/auth/google`
  },

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post('/logout')
    return response.data
  },

  // Refresh access token
  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await authApi.post('/refresh')
    return response.data
  },

  // Get user profile
  async getProfile(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await authApi.get('/profile')
    return response.data
  },

  // Update user profile
  async updateProfile(data: ProfileUpdateData): Promise<{ success: boolean; data: { user: User } }> {
    const response = await authApi.put('/profile', data)
    return response.data
  },

  // Change password
  async changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const response = await authApi.put('/change-password', data)
    return response.data
  },

  // Forgot password
  async forgotPassword(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post('/forgot-password', data)
    return response.data
  },

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post('/reset-password', data)
    return response.data
  },

  // Verify email
  async verifyEmail(data: VerifyEmailData): Promise<{ success: boolean; message: string }> {
    const response = await authApi.post('/verify-email', data)
    return response.data
  },

  // Check authentication status
  async checkAuth(): Promise<{ success: boolean; data: { user: User } }> {
    const response = await authApi.get('/check')
    return response.data
  },

  // Set tokens in localStorage
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  },

  // Get tokens from localStorage
  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    }
  },

  // Clear tokens from localStorage
  clearTokens(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  }
}

export default authService 