import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/hooks/cart/useCart'
import { useAuth } from '@/hooks/auth/useAuth'
import { PaymentForm } from '@/components/payment/PaymentForm'
import { formatCurrency } from '@/lib/utils'

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { items, total } = useCart()
  
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }

    if (items.length === 0) {
      navigate('/cart')
      return
    }
  }, [isAuthenticated, items, navigate])

  const handlePaymentSuccess = () => {
    navigate('/orders/confirmation')
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div>
            <PaymentForm
              amount={Math.round(total * 100)}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 