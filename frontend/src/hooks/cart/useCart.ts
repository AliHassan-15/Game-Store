import { useEffect } from 'react'
import { useCartStore } from '@/store/slices/cart/cartSlice'

export const useCart = () => {
  const {
    cart,
    isLoading,
    error,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setCart,
    setLoading,
    setError,
    resetCart,
  } = useCartStore()

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [])

  // Computed values
  const totalItems = cart?.totalItems || 0
  const subtotal = cart?.subtotal || 0
  const discount = cart?.discount || 0
  const tax = cart?.tax || 0
  const total = cart?.total || 0
  const currency = cart?.currency || 'USD'
  const items = cart?.items || []

  return {
    cart,
    items,
    isLoading,
    error,
    totalItems,
    subtotal,
    discount,
    tax,
    total,
    currency,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setCart,
    setLoading,
    setError,
    resetCart,
    hasItems: items.length > 0,
    isEmpty: items.length === 0,
  }
}