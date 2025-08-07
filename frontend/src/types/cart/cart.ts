import { Product } from '../product/product'

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  currency: string
  totalItems: number
  createdAt: string
  updatedAt: string
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  
  // Relations
  product: Product
}

export interface CartItemAddData {
  productId: string
  quantity: number
}

export interface CartItemUpdateData {
  cartItemId: string
  quantity: number
}

export interface CartItemRemoveData {
  cartItemId: string
}

export interface CartResponse {
  success: boolean
  data: {
    cart: Cart
  }
}

export interface CartItemResponse {
  success: boolean
  data: {
    cartItem: CartItem
  }
}