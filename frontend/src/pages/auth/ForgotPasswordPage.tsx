import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ForgotPasswordForm } from '@/components/auth/forgotPassword/ForgotPasswordForm'

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GameStore
          </h1>
          <p className="text-gray-600">
            Reset your password
          </p>
        </motion.div>

        {/* Forgot Password Form */}
        <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
      </div>
    </div>
  )
} 