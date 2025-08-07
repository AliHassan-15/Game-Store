import React from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '@/hooks/order/useOrders'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card/Card'
import { Button } from '@/components/ui/button/Button'

export const OrderListPage: React.FC = () => {
  const { orders, isLoading, error, hasOrders } = useOrders()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
      {isLoading && <div>Loading orders...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {!isLoading && !hasOrders && (
        <div className="text-center text-gray-500 py-12">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
          <Link to="/products">
            <Button>Shop Now</Button>
          </Link>
        </div>
      )}
      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="font-semibold text-lg text-gray-900 mb-1">Order #{order.orderNumber}</div>
                <div className="text-sm text-gray-500 mb-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</div>
                <div className="text-sm text-gray-500">Status: <span className="font-medium text-blue-600">{order.status}</span></div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <div className="text-lg font-bold text-gray-900">{formatCurrency(order.total, order.currency)}</div>
                <Link to={`/orders/${order.id}`}>
                  <Button size="sm">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}