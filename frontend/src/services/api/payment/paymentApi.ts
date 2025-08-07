import axios from 'axios'
import {
  PaymentResponse,
  PaymentMethodResponse
} from '@/types/payment/payment'

const paymentApi = axios.create({
  baseURL: '/api/v1/payment',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
paymentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

class PaymentService {
  // Create payment intent
  async createPaymentIntent(data: any): Promise<PaymentResponse> {
    const response = await paymentApi.post('/create-payment-intent', data)
    return response.data
  }

  // Confirm payment
  async confirmPayment(data: any): Promise<PaymentResponse> {
    const response = await paymentApi.post('/confirm-payment', data)
    return response.data
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethodResponse> {
    const response = await paymentApi.get('/payment-methods')
    return response.data
  }
}

export default new PaymentService() 