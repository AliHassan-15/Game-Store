import { create } from 'zustand'
import { PaymentIntent, PaymentMethod, CreatePaymentIntentData, ConfirmPaymentData } from '@/types/payment/payment'
import paymentService from '@/services/api/payment/paymentApi'

interface PaymentState {
  paymentIntent: PaymentIntent | null
  paymentMethods: PaymentMethod[]
  isLoading: boolean
  error: string | null
  paymentStatus: 'idle' | 'processing' | 'succeeded' | 'failed'
}

interface PaymentStore extends PaymentState {
  // Actions
  createPaymentIntent: (data: CreatePaymentIntentData) => Promise<void>
  confirmPayment: (data: ConfirmPaymentData) => Promise<void>
  getPaymentMethods: () => Promise<void>
  clearPaymentIntent: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

const initialState: PaymentState = {
  paymentIntent: null,
  paymentMethods: [],
  isLoading: false,
  error: null,
  paymentStatus: 'idle',
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  ...initialState,

  // Create payment intent
  createPaymentIntent: async (data: CreatePaymentIntentData) => {
    try {
      set({ isLoading: true, error: null, paymentStatus: 'processing' })
      
      const response = await paymentService.createPaymentIntent(data)
      
      if (response.success) {
        set({
          paymentIntent: response.data.paymentIntent,
          isLoading: false,
          paymentStatus: 'processing',
        })
      } else {
        set({
          isLoading: false,
          error: 'Failed to create payment intent',
          paymentStatus: 'failed',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create payment intent',
        paymentStatus: 'failed',
      })
    }
  },

  // Confirm payment
  confirmPayment: async (data: ConfirmPaymentData) => {
    try {
      set({ isLoading: true, error: null, paymentStatus: 'processing' })
      
      const response = await paymentService.confirmPayment(data)
      
      if (response.success) {
        set({
          paymentIntent: response.data.paymentIntent,
          isLoading: false,
          paymentStatus: response.data.paymentIntent.status === 'succeeded' ? 'succeeded' : 'processing',
        })
      } else {
        set({
          isLoading: false,
          error: 'Payment confirmation failed',
          paymentStatus: 'failed',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Payment confirmation failed',
        paymentStatus: 'failed',
      })
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await paymentService.getPaymentMethods()
      
      if (response.success) {
        set({
          paymentMethods: response.data.paymentMethods,
          isLoading: false,
        })
      } else {
        set({
          isLoading: false,
          error: 'Failed to get payment methods',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to get payment methods',
      })
    }
  },

  // Clear payment intent
  clearPaymentIntent: () => {
    set({ paymentIntent: null, paymentStatus: 'idle' })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
})) 