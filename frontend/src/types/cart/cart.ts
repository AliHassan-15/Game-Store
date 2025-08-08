import { Product } from '../product/product'

export interface Cart {
  id: string | null
  userId: string | null
  items: CartItem[]
  subtotal: number
  totalItems: number
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  price: number
  comparePrice?: number
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