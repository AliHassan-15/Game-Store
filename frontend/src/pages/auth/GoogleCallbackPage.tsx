import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/auth/useAuth'
import authService from '@/services/api/auth/authApi'

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Get tokens from URL parameters
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage('Google authentication failed. Please try again.')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        if (!accessToken || !refreshToken) {
          setStatus('error')
          setMessage('Authentication tokens not found. Please try again.')
          setTimeout(() => navigate('/auth'), 3000)
          return
        }

        // Store tokens
        authService.setTokens(accessToken, refreshToken)
        setTokens(accessToken, refreshToken)

        // Get user profile
        try {
          const profileResponse = await authService.getProfile()
          if (profileResponse.success) {
            setUser(profileResponse.data.user)
            setStatus('success')
            setMessage('Successfully authenticated with Google!')
            
            // Redirect based on user role
            setTimeout(() => {
              if (profileResponse.data.user.role === 'admin') {
                navigate('/admin/dashboard')
              } else {
                navigate('/')
              }
            }, 1500)
          } else {
            throw new Error('Failed to get user profile')
          }
        } catch (profileError) {
          console.error('Profile fetch error:', profileError)
          setStatus('error')
          setMessage('Failed to get user profile. Please try again.')
          setTimeout(() => navigate('/auth'), 3000)
        }
      } catch (error) {
        console.error('Google callback error:', error)
        setStatus('error')
        setMessage('Authentication failed. Please try again.')
        setTimeout(() => navigate('/auth'), 3000)
      }
    }

    handleGoogleCallback()
  }, [searchParams, navigate, setTokens, setUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Google Sign-In
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to the dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
} 