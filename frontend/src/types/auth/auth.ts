export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'buyer'
  isVerified: boolean
  isActive: boolean
  googleId?: string
  avatar?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  accessToken: string | null
  refreshToken: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  role?: 'admin' | 'buyer'
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface RefreshTokenResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
  }
}

export interface ProfileUpdateData {
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface VerifyEmailData {
  token: string
}

export interface GoogleAuthResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface AuthError {
  success: false
  message: string
  code?: string
  errors?: Record<string, string[]>
} 