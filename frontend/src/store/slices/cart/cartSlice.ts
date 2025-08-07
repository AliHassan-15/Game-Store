import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, CartItemAddData, CartItemUpdateData, CartItemRemoveData } from '@/types/cart/cart'
import cartService from '@/services/api/cart/cartApi'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  error: string | null
}

interface CartStore extends CartState {
  fetchCart: () => Promise<void>
  addItem: (data: CartItemAddData) => Promise<void>
  updateItem: (data: CartItemUpdateData) => Promise<void>
  removeItem: (data: CartItemRemoveData) => Promise<void>
  clearCart: () => Promise<void>
  setCart: (cart: Cart | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetCart: () => void
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await cartService.getCart()
          if (response.success) {
            set({ cart: response.data.cart, isLoading: false })
          } else {
            set({ isLoading: false, error: 'Failed to fetch cart' })
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.response?.data?.message || 'Failed to fetch cart' })
        }
      },

      addItem: async (data: CartItemAddData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await cartService.addItem(data)
          if (response.success) {
            set({ cart: response.data.cart, isLoading: false })
          } else {
            set({ isLoading: false, error: 'Failed to add item to cart' })
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.response?.data?.message || 'Failed to add item to cart' })
        }
      },

      updateItem: async (data: CartItemUpdateData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await cartService.updateItem(data)
          if (response.success) {
            set({ cart: response.data.cart, isLoading: false })
          } else {
            set({ isLoading: false, error: 'Failed to update cart item' })
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.response?.data?.message || 'Failed to update cart item' })
        }
      },

      removeItem: async (data: CartItemRemoveData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await cartService.removeItem(data)
          if (response.success) {
            set({ cart: response.data.cart, isLoading: false })
          } else {
            set({ isLoading: false, error: 'Failed to remove cart item' })
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.response?.data?.message || 'Failed to remove cart item' })
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await cartService.clearCart()
          if (response.success) {
            set({ cart: response.data.cart, isLoading: false })
          } else {
            set({ isLoading: false, error: 'Failed to clear cart' })
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.response?.data?.message || 'Failed to clear cart' })
        }
      },

      setCart: (cart: Cart | null) => set({ cart }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      resetCart: () => set(initialState),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
)