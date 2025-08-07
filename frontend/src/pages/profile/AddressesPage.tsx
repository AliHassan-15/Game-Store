import React from 'react'
import { Link } from 'react-router-dom'
import { AddressList } from '@/components/profile/AddressList'
import { Card, CardContent } from '@/components/ui/card/Card'

export const AddressesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Addresses</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <nav className="space-y-2">
                <Link to="/profile" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                  Profile
                </Link>
                <Link to="/profile/addresses" className="block px-3 py-2 text-blue-600 bg-blue-50 rounded-md font-medium">
                  Addresses
                </Link>
                <Link to="/profile/payments" className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md">
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
          <AddressList />
        </div>
      </div>
    </div>
  )
} 