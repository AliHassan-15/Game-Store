import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent } from '@/components/ui/card/Card'

export const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">#ORD-123456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold">$99.99</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <p className="text-gray-600">
            You will receive an email confirmation shortly with your order details.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
            <Link to="/orders">
              <Button variant="outline">
                View My Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 