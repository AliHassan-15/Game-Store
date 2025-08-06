import { useEffect } from 'react'
import { useAuthStore } from '@/store/slices/auth/authSlice'
import { LoginCredentials, RegisterData } from '@/types/auth/auth'

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    refreshToken,
    login,
    register,
    logout,
    refreshToken: refreshTokenAction,
    getProfile,
    checkAuth,
    clearError,
    setLoading,
    setUser,
    setTokens,
    clearAuth,
  } = useAuthStore()

  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated && accessToken) {
      checkAuth()
    }
  }, [isAuthenticated, accessToken, checkAuth])

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!accessToken) return

    const tokenExpiryCheck = setInterval(() => {
      // Check if token is about to expire (5 minutes before)
      // This is a simplified check - in production you'd decode the JWT
      const tokenAge = Date.now() - (localStorage.getItem('tokenCreatedAt') ? parseInt(localStorage.getItem('tokenCreatedAt')!) : 0)
      const tokenLifetime = 15 * 60 * 1000 // 15 minutes in milliseconds
      
      if (tokenAge > tokenLifetime - 5 * 60 * 1000) { // 5 minutes before expiry
        refreshTokenAction()
      }
    }, 60000) // Check every minute

    return () => clearInterval(tokenExpiryCheck)
  }, [accessToken, refreshTokenAction])

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    refreshToken,

    // Actions
    login,
    register,
    logout,
    refreshToken: refreshTokenAction,
    getProfile,
    checkAuth,
    clearError,
    setLoading,
    setUser,
    setTokens,
    clearAuth,

    // Computed values
    isAdmin: user?.role === 'admin',
    isBuyer: user?.role === 'buyer',
    isVerified: user?.isVerified,
    isActive: user?.isActive,
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    initials: user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '',
  }
}

// Hook for protected routes
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [isAuthenticated, isLoading, redirectTo])

  return { isAuthenticated, isLoading }
}

// Hook for admin-only routes
export const useRequireAdmin = (redirectTo = '/') => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      window.location.href = redirectTo
    }
  }, [isAuthenticated, isLoading, isAdmin, redirectTo])

  return { isAuthenticated, isLoading, isAdmin }
}

// Hook for buyer-only routes
export const useRequireBuyer = (redirectTo = '/') => {
  const { isAuthenticated, isLoading, isBuyer } = useAuth()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isBuyer)) {
      window.location.href = redirectTo
    }
  }, [isAuthenticated, isLoading, isBuyer, redirectTo])

  return { isAuthenticated, isLoading, isBuyer }
} 