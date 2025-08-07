import { create } from 'zustand'
import { Order, OrderListResponse, OrderResponse } from '@/types/order/order'
import orderService from '@/services/api/orders/orderApi'

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  isLoading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface OrderStore extends OrderState {
  fetchOrders: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchOrderById: (orderId: string) => Promise<void>
  cancelOrder: (orderId: string) => Promise<void>
  setCurrentOrder: (order: Order | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetState: () => void
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 10,
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  ...initialState,

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response: OrderListResponse = await orderService.getMyOrders(params)
      if (response.success) {
        set({
          orders: response.data.orders,
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage,
          isLoading: false,
        })
      } else {
        set({ isLoading: false, error: 'Failed to fetch orders' })
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'Failed to fetch orders' })
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response: OrderResponse = await orderService.getOrderById(orderId)
      if (response.success) {
        set({ currentOrder: response.data.order, isLoading: false })
      } else {
        set({ isLoading: false, error: 'Failed to fetch order details' })
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'Failed to fetch order details' })
    }
  },

  cancelOrder: async (orderId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response: OrderResponse = await orderService.cancelOrder(orderId)
      if (response.success) {
        set({ currentOrder: response.data.order, isLoading: false })
        // Optionally refetch orders
        get().fetchOrders()
      } else {
        set({ isLoading: false, error: 'Failed to cancel order' })
      }
    } catch (error: any) {
      set({ isLoading: false, error: error.response?.data?.message || 'Failed to cancel order' })
    }
  },

  setCurrentOrder: (order: Order | null) => set({ currentOrder: order }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  resetState: () => set(initialState),
}))