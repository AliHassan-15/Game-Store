import React, { useEffect } from 'react'
import { useAuth } from '@/hooks/auth/useAuth'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireBuyer?: boolean
  fallback?: React.ReactNode
  redirectTo?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireBuyer = false,
  fallback,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth()

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth()
    }
  }, [isAuthenticated, isLoading, checkAuth])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    )
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to login
    if (redirectTo) {
      window.location.href = redirectTo
    } else {
      window.location.href = '/auth'
    }
    
    return null
  }

  // Check if admin access is required
  if (requireAdmin && (!isAuthenticated || user?.role !== 'admin')) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to home or unauthorized page
    if (redirectTo) {
      window.location.href = redirectTo
    } else {
      window.location.href = '/'
    }
    
    return null
  }

  // Check if buyer access is required
  if (requireBuyer && (!isAuthenticated || user?.role !== 'buyer')) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Redirect to home or unauthorized page
    if (redirectTo) {
      window.location.href = redirectTo
    } else {
      window.location.href = '/'
    }
    
    return null
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard {...options}>
      <Component {...props} />
    </AuthGuard>
  )

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Higher-order component for admin-only routes
export const withAdmin = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return withAuth(Component, { requireAuth: true, requireAdmin: true })
}

// Higher-order component for buyer-only routes
export const withBuyer = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return withAuth(Component, { requireAuth: true, requireBuyer: true })
} 