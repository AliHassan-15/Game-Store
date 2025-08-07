import { useEffect } from 'react'
import { useOrderStore } from '@/store/slices/order/orderSlice'

export const useOrders = () => {
  const {
    orders,
    currentOrder,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    setCurrentOrder,
    setLoading,
    setError,
    resetState,
  } = useOrderStore()

  useEffect(() => {
    fetchOrders()
  }, [])

  return {
    orders,
    currentOrder,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    fetchOrders,
    fetchOrderById,
    cancelOrder,
    setCurrentOrder,
    setLoading,
    setError,
    resetState,
    hasOrders: orders.length > 0,
    isEmpty: orders.length === 0,
  }
}

export const useOrder = (orderId?: string) => {
  const { currentOrder, fetchOrderById, isLoading, error } = useOrderStore()

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId)
    }
  }, [orderId])

  return {
    order: currentOrder,
    isLoading,
    error,
    fetchOrderById,
  }
}