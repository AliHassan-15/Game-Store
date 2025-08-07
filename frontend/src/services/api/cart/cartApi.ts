import axios from 'axios'
import {
  CartResponse,
  CartItemAddData,
  CartItemUpdateData,
  CartItemRemoveData
} from '@/types/cart/cart'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const cartApi = axios.create({
  baseURL: `${API_BASE_URL}/cart`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

cartApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const cartService = {
  // Get current user's cart
  async getCart(): Promise<CartResponse> {
    const response = await cartApi.get('/')
    return response.data
  },

  // Add item to cart
  async addItem(data: CartItemAddData): Promise<CartResponse> {
    const response = await cartApi.post('/items', data)
    return response.data
  },

  // Update cart item quantity
  async updateItem(data: CartItemUpdateData): Promise<CartResponse> {
    const response = await cartApi.put(`/items/${data.cartItemId}`, { quantity: data.quantity })
    return response.data
  },

  // Remove item from cart
  async removeItem(data: CartItemRemoveData): Promise<CartResponse> {
    const response = await cartApi.delete(`/items/${data.cartItemId}`)
    return response.data
  },

  // Clear cart
  async clearCart(): Promise<CartResponse> {
    const response = await cartApi.delete('/clear')
    return response.data
  },
}

export default cartService