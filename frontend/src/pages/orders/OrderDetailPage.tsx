import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useOrder } from '@/hooks/order/useOrders'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card/Card'
import { Button } from '@/components/ui/button/Button'

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { order, isLoading, error, fetchOrderById } = useOrder(orderId)

  React.useEffect(() => {
    if (orderId) fetchOrderById(orderId)
  }, [orderId])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading order details...</div>
  }
  if (error || !order) {
    return <div className="container mx-auto px-4 py-8 text-red-600">{error || 'Order not found.'}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Order #{order.orderNumber}</h1>
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <div>
              <div className="text-gray-600 mb-1">Order Date: {new Date(order.createdAt).toLocaleDateString()}</div>
              <div className="text-gray-600 mb-1">Status: <span className="font-medium text-blue-600">{order.status}</span></div>
              <div className="text-gray-600">Total: <span className="font-bold">{formatCurrency(order.total, order.currency)}</span></div>
            </div>
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <Button variant="outline" size="sm" onClick={() => alert('Cancel order functionality')}>Cancel Order</Button>
              )}
              <Link to="/orders">
                <Button size="sm">Back to Orders</Button>
              </Link>
            </div>
          </div>
          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-semibold mb-2">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0">
                  <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold text-gray-900">{formatCurrency(item.subtotal, order.currency)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Link to="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}