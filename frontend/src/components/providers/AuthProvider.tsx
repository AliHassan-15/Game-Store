import React, { useEffect } from 'react'

import { useAuth } from '@/hooks/auth/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, accessToken } = useAuth()

  // Initialize authentication on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        if (accessToken) {
          await checkAuth()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      }
    }

    initializeAuth()
  }, [checkAuth, accessToken])

  return <>{children}</>
} 