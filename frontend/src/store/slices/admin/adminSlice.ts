import { create } from 'zustand'
import { AdminDashboardStats, AdminUser, AdminOrder, AdminProduct, AdminCategory, AdminReview, AdminInventoryTransaction, AdminActivityLog } from '@/types/admin/admin'
import * as adminApi from '@/services/api/admin/adminApi'

interface AdminState {
  // Dashboard
  dashboardStats: AdminDashboardStats | null
  isLoading: boolean
  error: string | null
  
  // Users
  users: AdminUser[]
  usersLoading: boolean
  usersError: string | null
  
  // Products
  products: AdminProduct[]
  productsLoading: boolean
  productsError: string | null
  
  // Orders
  orders: AdminOrder[]
  ordersLoading: boolean
  ordersError: string | null
  
  // Categories
  categories: AdminCategory[]
  categoriesLoading: boolean
  categoriesError: string | null
  
  // Reviews
  reviews: AdminReview[]
  reviewsLoading: boolean
  reviewsError: string | null
  
  // Inventory
  inventory: AdminProduct[]
  lowStockProducts: AdminProduct[]
  outOfStockProducts: AdminProduct[]
  inventoryTransactions: AdminInventoryTransaction[]
  inventoryLoading: boolean
  inventoryError: string | null
  
  // Activity Logs
  activityLogs: AdminActivityLog[]
  activityLogsLoading: boolean
  activityLogsError: string | null
}

interface AdminStore extends AdminState {
  // Dashboard Actions
  getDashboardStats: () => Promise<void>
  
  // User Actions
  getUsers: (params?: any) => Promise<void>
  getUser: (userId: string) => Promise<AdminUser | null>
  updateUser: (userId: string, data: Partial<AdminUser>) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  
  // Product Actions
  getProducts: (params?: any) => Promise<void>
  getProduct: (productId: string) => Promise<AdminProduct | null>
  createProduct: (data: Partial<AdminProduct>) => Promise<void>
  updateProduct: (productId: string, data: Partial<AdminProduct>) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  
  // Category Actions
  getCategories: () => Promise<void>
  createCategory: (data: Partial<AdminCategory>) => Promise<void>
  updateCategory: (categoryId: string, data: Partial<AdminCategory>) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>
  
  // Order Actions
  getOrders: (params?: any) => Promise<void>
  getOrder: (orderId: string) => Promise<AdminOrder | null>
  updateOrderStatus: (orderId: string, status: string) => Promise<void>
  
  // Review Actions
  getReviews: (params?: any) => Promise<void>
  moderateReview: (reviewId: string, action: 'approve' | 'reject' | 'delete') => Promise<void>
  
  // Inventory Actions
  getInventory: (params?: any) => Promise<void>
  getLowStock: () => Promise<void>
  getOutOfStock: () => Promise<void>
  getInventoryTransactions: (params?: any) => Promise<void>
  
  // Activity Logs
  getActivityLogs: (params?: any) => Promise<void>
  getUserActivityLogs: (userId: string) => Promise<void>
  
  // Utility Actions
  clearError: () => void
  setError: (error: string | null) => void
}

const initialState: AdminState = {
  // Dashboard
  dashboardStats: null,
  isLoading: false,
  error: null,
  
  // Users
  users: [],
  usersLoading: false,
  usersError: null,
  
  // Products
  products: [],
  productsLoading: false,
  productsError: null,
  
  // Orders
  orders: [],
  ordersLoading: false,
  ordersError: null,
  
  // Categories
  categories: [],
  categoriesLoading: false,
  categoriesError: null,
  
  // Reviews
  reviews: [],
  reviewsLoading: false,
  reviewsError: null,
  
  // Inventory
  inventory: [],
  lowStockProducts: [],
  outOfStockProducts: [],
  inventoryTransactions: [],
  inventoryLoading: false,
  inventoryError: null,
  
  // Activity Logs
  activityLogs: [],
  activityLogsLoading: false,
  activityLogsError: null,
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  ...initialState,

  // Dashboard Actions
  getDashboardStats: async () => {
    try {
      set({ isLoading: true, error: null })
      const response = await adminApi.getDashboardStats()
      set({ dashboardStats: response.data, isLoading: false })
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to get dashboard stats',
      })
    }
  },

  // User Actions
  getUsers: async (params?: any) => {
    try {
      set({ usersLoading: true, usersError: null })
      const response = await adminApi.getUsers(params)
      const responseData = response.data as any
      set({ users: responseData?.users || [], usersLoading: false })
    } catch (error: any) {
      set({
        usersLoading: false,
        usersError: error.message || 'Failed to get users',
      })
    }
  },

  getUser: async (userId: string) => {
    try {
      const response = await adminApi.getUser(userId)
      return response.data
    } catch (error: any) {
      set({ usersError: error.message || 'Failed to get user' })
      return null
    }
  },

  updateUser: async (userId: string, data: Partial<AdminUser>) => {
    try {
      await adminApi.updateUser(userId, data)
      // Refresh users list
      await get().getUsers()
    } catch (error: any) {
      set({ usersError: error.message || 'Failed to update user' })
      throw error
    }
  },

  deleteUser: async (userId: string) => {
    try {
      await adminApi.deleteUser(userId)
      // Refresh users list
      await get().getUsers()
    } catch (error: any) {
      set({ usersError: error.message || 'Failed to delete user' })
      throw error
    }
  },

  // Product Actions
  getProducts: async (params?: any) => {
    try {
      set({ productsLoading: true, productsError: null })
      const response = await adminApi.getProducts(params)
      // API returns { success: true, data: { products: [...] } }
      const responseData = response.data as any
      set({ products: responseData?.products || [], productsLoading: false })
    } catch (error: any) {
      set({
        productsLoading: false,
        productsError: error.message || 'Failed to get products',
      })
    }
  },

  getProduct: async (productId: string) => {
    try {
      const response = await adminApi.getProduct(productId)
      return response.data
    } catch (error: any) {
      set({ productsError: error.message || 'Failed to get product' })
      return null
    }
  },

  createProduct: async (data: Partial<AdminProduct>) => {
    try {
      await adminApi.createProduct(data)
      // Refresh products list
      await get().getProducts()
    } catch (error: any) {
      set({ productsError: error.message || 'Failed to create product' })
      throw error
    }
  },

  updateProduct: async (productId: string, data: Partial<AdminProduct>) => {
    try {
      await adminApi.updateProduct(productId, data)
      // Refresh products list
      await get().getProducts()
    } catch (error: any) {
      set({ productsError: error.message || 'Failed to update product' })
      throw error
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      await adminApi.deleteProduct(productId)
      // Refresh products list
      await get().getProducts()
    } catch (error: any) {
      set({ productsError: error.message || 'Failed to delete product' })
      throw error
    }
  },

  // Category Actions
  getCategories: async () => {
    try {
      set({ categoriesLoading: true, categoriesError: null })
      const response = await adminApi.getCategories()
      const responseData = response.data as any
      set({ categories: responseData?.categories || [], categoriesLoading: false })
    } catch (error: any) {
      set({
        categoriesLoading: false,
        categoriesError: error.message || 'Failed to get categories',
      })
    }
  },

  createCategory: async (data: Partial<AdminCategory>) => {
    try {
      await adminApi.createCategory(data)
      // Refresh categories list
      await get().getCategories()
    } catch (error: any) {
      set({ categoriesError: error.message || 'Failed to create category' })
      throw error
    }
  },

  updateCategory: async (categoryId: string, data: Partial<AdminCategory>) => {
    try {
      await adminApi.updateCategory(categoryId, data)
      // Refresh categories list
      await get().getCategories()
    } catch (error: any) {
      set({ categoriesError: error.message || 'Failed to update category' })
      throw error
    }
  },

  deleteCategory: async (categoryId: string) => {
    try {
      await adminApi.deleteCategory(categoryId)
      // Refresh categories list
      await get().getCategories()
    } catch (error: any) {
      set({ categoriesError: error.message || 'Failed to delete category' })
      throw error
    }
  },

  // Order Actions
  getOrders: async (params?: any) => {
    try {
      set({ ordersLoading: true, ordersError: null })
      const response = await adminApi.getOrders(params)
      // API returns { success: true, data: { orders: [...] } }
      const responseData = response.data as any
      set({ orders: responseData?.orders || [], ordersLoading: false })
    } catch (error: any) {
      set({
        ordersLoading: false,
        ordersError: error.message || 'Failed to get orders',
      })
    }
  },

  getOrder: async (orderId: string) => {
    try {
      const response = await adminApi.getOrder(orderId)
      return response.data
    } catch (error: any) {
      set({ ordersError: error.message || 'Failed to get order' })
      return null
    }
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status)
      // Refresh orders list
      await get().getOrders()
    } catch (error: any) {
      set({ ordersError: error.message || 'Failed to update order status' })
      throw error
    }
  },

  // Review Actions
  getReviews: async (params?: any) => {
    try {
      set({ reviewsLoading: true, reviewsError: null })
      const response = await adminApi.getReviews(params)
      const responseData = response.data as any
      set({ reviews: responseData?.reviews || [], reviewsLoading: false })
    } catch (error: any) {
      set({
        reviewsLoading: false,
        reviewsError: error.message || 'Failed to get reviews',
      })
    }
  },

  moderateReview: async (reviewId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      await adminApi.moderateReview(reviewId, action)
      // Refresh reviews list
      await get().getReviews()
    } catch (error: any) {
      set({ reviewsError: error.message || 'Failed to moderate review' })
      throw error
    }
  },

  // Inventory Actions
  getInventory: async (params?: any) => {
    try {
      set({ inventoryLoading: true, inventoryError: null })
      const response = await adminApi.getInventory(params)
      set({ inventory: response.data, inventoryLoading: false })
    } catch (error: any) {
      set({
        inventoryLoading: false,
        inventoryError: error.message || 'Failed to get inventory',
      })
    }
  },

  getLowStock: async () => {
    try {
      const response = await adminApi.getLowStock()
      set({ lowStockProducts: response.data })
    } catch (error: any) {
      set({ inventoryError: error.message || 'Failed to get low stock products' })
    }
  },

  getOutOfStock: async () => {
    try {
      const response = await adminApi.getOutOfStock()
      set({ outOfStockProducts: response.data })
    } catch (error: any) {
      set({ inventoryError: error.message || 'Failed to get out of stock products' })
    }
  },

  getInventoryTransactions: async (params?: any) => {
    try {
      const response = await adminApi.getInventoryTransactions(params)
      set({ inventoryTransactions: response.data })
    } catch (error: any) {
      set({ inventoryError: error.message || 'Failed to get inventory transactions' })
    }
  },

  // Activity Logs
  getActivityLogs: async (params?: any) => {
    try {
      set({ activityLogsLoading: true, activityLogsError: null })
      const response = await adminApi.getActivityLogs(params)
      set({ activityLogs: response.data, activityLogsLoading: false })
    } catch (error: any) {
      set({
        activityLogsLoading: false,
        activityLogsError: error.message || 'Failed to get activity logs',
      })
    }
  },

  getUserActivityLogs: async (userId: string) => {
    try {
      const response = await adminApi.getUserActivityLogs(userId)
      set({ activityLogs: response.data })
    } catch (error: any) {
      set({ activityLogsError: error.message || 'Failed to get user activity logs' })
    }
  },

  // Utility Actions
  clearError: () => set({ error: null }),
  setError: (error: string | null) => set({ error }),
})) 