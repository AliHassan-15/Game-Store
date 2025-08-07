import { create } from 'zustand'
import { UserProfile, UserProfileUpdate, UserAddress, UserAddressCreate, UserPayment, UserPaymentCreate } from '@/types/user/user'
import userService from '@/services/api/user/userApi'

interface UserState {
  profile: UserProfile | null
  addresses: UserAddress[]
  paymentMethods: UserPayment[]
  isLoading: boolean
  error: string | null
}

interface UserStore extends UserState {
  // Actions
  getProfile: () => Promise<void>
  updateProfile: (data: UserProfileUpdate) => Promise<void>
  getAddresses: () => Promise<void>
  createAddress: (data: UserAddressCreate) => Promise<void>
  updateAddress: (id: string, data: Partial<UserAddressCreate>) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  getPaymentMethods: () => Promise<void>
  createPaymentMethod: (data: UserPaymentCreate) => Promise<void>
  updatePaymentMethod: (id: string, data: Partial<UserPaymentCreate>) => Promise<void>
  deletePaymentMethod: (id: string) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

const initialState: UserState = {
  profile: null,
  addresses: [],
  paymentMethods: [],
  isLoading: false,
  error: null,
}

export const useUserStore = create<UserStore>((set, get) => ({
  ...initialState,

  // Get user profile
  getProfile: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.getProfile()
      
      if (response.success) {
        set({ profile: response.data.user, isLoading: false })
      } else {
        set({ isLoading: false, error: 'Failed to get profile' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to get profile',
      })
    }
  },

  // Update user profile
  updateProfile: async (data: UserProfileUpdate) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.updateProfile(data)
      
      if (response.success) {
        set({ profile: response.data.user, isLoading: false })
      } else {
        set({ isLoading: false, error: 'Failed to update profile' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update profile',
      })
    }
  },

  // Get user addresses
  getAddresses: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.getAddresses()
      
      if (response.success) {
        set({ addresses: response.data.addresses, isLoading: false })
      } else {
        set({ isLoading: false, error: 'Failed to get addresses' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to get addresses',
      })
    }
  },

  // Create address
  createAddress: async (data: UserAddressCreate) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.createAddress(data)
      
      if (response.success) {
        // Refresh addresses list
        get().getAddresses()
      } else {
        set({ isLoading: false, error: 'Failed to create address' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create address',
      })
    }
  },

  // Update address
  updateAddress: async (id: string, data: Partial<UserAddressCreate>) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.updateAddress(id, data)
      
      if (response.success) {
        // Refresh addresses list
        get().getAddresses()
      } else {
        set({ isLoading: false, error: 'Failed to update address' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update address',
      })
    }
  },

  // Delete address
  deleteAddress: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.deleteAddress(id)
      
      if (response.success) {
        // Refresh addresses list
        get().getAddresses()
      } else {
        set({ isLoading: false, error: 'Failed to delete address' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to delete address',
      })
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.getPaymentMethods()
      
      if (response.success) {
        set({ paymentMethods: response.data.paymentMethods, isLoading: false })
      } else {
        set({ isLoading: false, error: 'Failed to get payment methods' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to get payment methods',
      })
    }
  },

  // Create payment method
  createPaymentMethod: async (data: UserPaymentCreate) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.createPaymentMethod(data)
      
      if (response.success) {
        // Refresh payment methods list
        get().getPaymentMethods()
      } else {
        set({ isLoading: false, error: 'Failed to create payment method' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to create payment method',
      })
    }
  },

  // Update payment method
  updatePaymentMethod: async (id: string, data: Partial<UserPaymentCreate>) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.updatePaymentMethod(id, data)
      
      if (response.success) {
        // Refresh payment methods list
        get().getPaymentMethods()
      } else {
        set({ isLoading: false, error: 'Failed to update payment method' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update payment method',
      })
    }
  },

  // Delete payment method
  deletePaymentMethod: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await userService.deletePaymentMethod(id)
      
      if (response.success) {
        // Refresh payment methods list
        get().getPaymentMethods()
      } else {
        set({ isLoading: false, error: 'Failed to delete payment method' })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to delete payment method',
      })
    }
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