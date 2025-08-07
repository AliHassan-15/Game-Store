import { useEffect } from 'react'
import { useUserStore } from '@/store/slices/user/userSlice'

export const useUser = () => {
  const {
    profile,
    addresses,
    paymentMethods,
    isLoading,
    error,
    getProfile,
    updateProfile,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    clearError,
    setLoading,
  } = useUserStore()

  // Load user data on mount
  useEffect(() => {
    getProfile()
    getAddresses()
    getPaymentMethods()
  }, [getProfile, getAddresses, getPaymentMethods])

  return {
    // State
    profile,
    addresses,
    paymentMethods,
    isLoading,
    error,

    // Actions
    getProfile,
    updateProfile,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    getPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    clearError,
    setLoading,

    // Computed values
    hasAddresses: addresses.length > 0,
    hasPaymentMethods: paymentMethods.length > 0,
    defaultAddress: addresses.find(addr => addr.isDefault),
    defaultPaymentMethod: paymentMethods.find(pm => pm.isDefault),
  }
} 