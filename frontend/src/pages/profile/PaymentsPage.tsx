import React from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@/hooks/user/useUser'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent } from '@/components/ui/card/Card'

export const PaymentsPage: React.FC = () => {
  const { paymentMethods, isLoading, deletePaymentMethod } = useUser()

  const handleDelete = async (paymentMethodId: string) => {
    if (window.confirm('Delete this payment method?')) {
      await deletePaymentMethod(paymentMethodId)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment Methods</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <nav className="space-y-2">
                <Link to="/profile" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                  Profile
                </Link>
                <Link to="/profile/addresses" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                  Addresses
                </Link>
                <Link to="/profile/payments" className="block px-3 py-2 text-blue-600 bg-blue-50 rounded-md font-medium">
                  Payment Methods
                </Link>
                <Link to="/orders" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                  My Orders
                </Link>
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Payment Methods</h2>
              <Button>Add Payment Method</Button>
            </div>

            {isLoading ? (
              <div>Loading...</div>
            ) : paymentMethods.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 mb-4">No payment methods found.</p>
                  <Button>Add Payment Method</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {paymentMethods.map((paymentMethod) => (
                  <Card key={paymentMethod.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">
                            {paymentMethod.brand} •••• {paymentMethod.last4}
                          </h3>
                          <p className="text-gray-600">
                            Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(paymentMethod.id)}>
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 