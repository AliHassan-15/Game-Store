import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/auth/useAuth'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireBuyer?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireBuyer = false,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuth()
  const location = useLocation()

  // Check authentication status if not already authenticated
  React.useEffect(() => {
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
    const loginPath = redirectTo || '/auth'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // Check if admin access is required
  if (requireAdmin && (!isAuthenticated || user?.role !== 'admin')) {
    const redirectPath = redirectTo || '/'
    return <Navigate to={redirectPath} replace />
  }

  // Check if buyer access is required
  if (requireBuyer && (!isAuthenticated || user?.role !== 'buyer')) {
    const redirectPath = redirectTo || '/'
    return <Navigate to={redirectPath} replace />
  }

  // User is authenticated and has required permissions
  return <>{children}</>
}

// Higher-order component for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
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