import { usePaymentStore } from '@/store/slices/payment/paymentSlice'

export const usePayment = () => {
  const {
    paymentIntent,
    paymentMethods,
    isLoading,
    error,
    paymentStatus,
    createPaymentIntent,
    confirmPayment,
    getPaymentMethods,
    clearPaymentIntent,
    clearError,
    setLoading,
  } = usePaymentStore()

  return {
    // State
    paymentIntent,
    paymentMethods,
    isLoading,
    error,
    paymentStatus,

    // Actions
    createPaymentIntent,
    confirmPayment,
    getPaymentMethods,
    clearPaymentIntent,
    clearError,
    setLoading,

    // Computed values
    hasPaymentMethods: paymentMethods.length > 0,
    isProcessing: paymentStatus === 'processing',
    isSuccess: paymentStatus === 'succeeded',
    isFailed: paymentStatus === 'failed',
  }
} 