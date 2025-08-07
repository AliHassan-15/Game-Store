import axios from 'axios'
import {
  OrderListResponse,
  OrderResponse,
  OrderCreateData,
  OrderUpdateData,
  OrderCreateResponse
} from '@/types/order/order'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const orderApi = axios.create({
  baseURL: `${API_BASE_URL}/orders`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

orderApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const orderService = {
  // Create order
  async createOrder(data: OrderCreateData): Promise<OrderCreateResponse> {
    const response = await orderApi.post('/', data)
    return response.data
  },

  // Get current user's orders
  async getMyOrders(params?: { page?: number; limit?: number }): Promise<OrderListResponse> {
    const response = await orderApi.get('/my', { params })
    return response.data
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<OrderResponse> {
    const response = await orderApi.get(`/${orderId}`)
    return response.data
  },

  // Cancel order
  async cancelOrder(orderId: string): Promise<OrderResponse> {
    const response = await orderApi.post(`/${orderId}/cancel`)
    return response.data
  },
}

export default orderService