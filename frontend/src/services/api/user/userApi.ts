import axios from 'axios'
import {

  UserProfileUpdate,

  UserAddressCreate,

  UserPaymentCreate,
  UserAddressListResponse,
  UserPaymentMethodListResponse,
  UserProfileResponse
} from '@/types/user/user'

const userApi = axios.create({
  baseURL: '/api/v1/users',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

class UserService {
  // Get user profile
  async getProfile(): Promise<UserProfileResponse> {
    const response = await userApi.get('/profile')
    return response.data
  }

  // Update user profile
  async updateProfile(data: UserProfileUpdate): Promise<UserProfileResponse> {
    const response = await userApi.put('/profile', data)
    return response.data
  }

  // Get user addresses
  async getAddresses(): Promise<UserAddressListResponse> {
    const response = await userApi.get('/addresses')
    return response.data
  }

  // Create address
  async createAddress(data: UserAddressCreate): Promise<{ success: boolean; message: string }> {
    const response = await userApi.post('/addresses', data)
    return response.data
  }

  // Update address
  async updateAddress(id: string, data: Partial<UserAddressCreate>): Promise<{ success: boolean; message: string }> {
    const response = await userApi.put(`/addresses/${id}`, data)
    return response.data
  }

  // Delete address
  async deleteAddress(id: string): Promise<{ success: boolean; message: string }> {
    const response = await userApi.delete(`/addresses/${id}`)
    return response.data
  }

  // Get payment methods
  async getPaymentMethods(): Promise<UserPaymentMethodListResponse> {
    const response = await userApi.get('/payment-methods')
    return response.data
  }

  // Create payment method
  async createPaymentMethod(data: UserPaymentCreate): Promise<{ success: boolean; message: string }> {
    const response = await userApi.post('/payment-methods', data)
    return response.data
  }

  // Update payment method
  async updatePaymentMethod(id: string, data: Partial<UserPaymentCreate>): Promise<{ success: boolean; message: string }> {
    const response = await userApi.put(`/payment-methods/${id}`, data)
    return response.data
  }

  // Delete payment method
  async deletePaymentMethod(id: string): Promise<{ success: boolean; message: string }> {
    const response = await userApi.delete(`/payment-methods/${id}`)
    return response.data
  }
}

export default new UserService()