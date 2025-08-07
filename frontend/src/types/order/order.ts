import { UserAddress, UserPayment } from '@/types/user/user'

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: string
  shippingMethod: string
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  user?: User
  items?: OrderItem[]
  billingAddress?: UserAddress
  shippingAddress?: UserAddress
  paymentMethodDetails?: UserPayment
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: string
  updatedAt: string
  
  // Relations
  product?: Product
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  thumbnail?: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface OrderCreateData {
  items: Array<{
    productId: string
    quantity: number
  }>
  billingAddress: Partial<UserAddress>
  shippingAddress: Partial<UserAddress>
  paymentMethod: Partial<UserPayment>
  shippingMethod: string
  notes?: string
}

export interface OrderUpdateData {
  status?: Order['status']
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
}

export interface OrderListResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface OrderResponse {
  success: boolean
  data: {
    order: Order
  }
}

export interface OrderCreateResponse {
  success: boolean
  data: {
    order: Order
    paymentIntent?: {
      id: string
      clientSecret: string
    }
  }
} 