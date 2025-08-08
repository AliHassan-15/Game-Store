import React, { useEffect } from 'react'
import { useAdminStore } from '@/store/slices/admin/adminSlice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card'
import { Badge } from '@/components/ui/badge/Badge'
import { Loader2, DollarSign, ShoppingCart, Users, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const AnalyticsPage: React.FC = () => {
  const {
    dashboardStats,
    isLoading,
    error,
    getDashboardStats,
  } = useAdminStore()

  useEffect(() => {
    getDashboardStats()
  }, [getDashboardStats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading analytics: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardStats?.newUsersThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.activeProducts || 0} active
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats?.pendingOrders || 0} pending
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardStats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(dashboardStats?.revenueThisMonth || 0)} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardStats?.recentOrders?.length ? (
              dashboardStats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                    <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No recent orders</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardStats?.lowStockProducts?.length ? (
                dashboardStats.lowStockProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="secondary">{product.stockQuantity} left</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No low stock products</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Out of Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardStats?.outOfStockProducts?.length ? (
                dashboardStats.outOfStockProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No out of stock products</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 