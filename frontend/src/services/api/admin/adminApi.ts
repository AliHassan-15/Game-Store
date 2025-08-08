import axios from 'axios'
import {
  AdminDashboardStats,
  AdminUser,
  AdminOrder,
  AdminProduct,
  AdminCategory,
  AdminReview,
  AdminInventoryTransaction,
  AdminApiResponse,
  AdminSystemLog,
  AdminActivityLog,
  AdminReport,
} from '@/types/admin/admin'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  withCredentials: true,
})

// Request interceptor to add auth token
adminApi.interceptors.request.use(
  (config) => {
    // Try to get token from localStorage first
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Temporary fix: Use a hardcoded admin token for development
      const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzZThiNWE1YS1mMDhjLTQxYTQtYTMzNS1mZTAyNTdiZjg3NTAiLCJyb2xlIjoiYWRtaW4iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU0NjQ1MTc0LCJleHAiOjE3NTQ2NDYwNzQsImF1ZCI6ImdhbWVzdG9yZS11c2VycyIsImlzcyI6ImdhbWVzdG9yZSJ9.BBXwphOe4A2ioPl0AWbJ-A4__cwT7_41Bl-UvAwSVAc'
      config.headers.Authorization = `Bearer ${adminToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return adminApi(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/auth'
      }
    }

    return Promise.reject(error)
  }
)

// --- Dashboard & Analytics ---
export const getDashboard = async (): Promise<AdminApiResponse<AdminDashboardStats>> => {
  const response = await adminApi.get('/dashboard')
  return response.data
}
export const getDashboardStats = getDashboard // alias for compatibility
export const getProductStats = async () => (await adminApi.get('/products/stats')).data
export const getUserStats = async () => (await adminApi.get('/users/stats')).data
export const getOrderStats = async () => (await adminApi.get('/orders/stats')).data
export const getSalesAnalytics = async () => (await adminApi.get('/analytics/sales')).data
export const getRevenueAnalytics = async () => (await adminApi.get('/analytics/revenue')).data
export const getProductAnalytics = async () => (await adminApi.get('/analytics/products')).data
export const getUserAnalytics = async () => (await adminApi.get('/analytics/users')).data

// --- Users ---
export const getUsers = async (params?: any): Promise<AdminApiResponse<AdminUser[]>> => {
  const response = await adminApi.get('/users', { params })
  return response.data
}
export const getUser = async (userId: string): Promise<AdminApiResponse<AdminUser>> => {
  const response = await adminApi.get(`/users/${userId}`)
  return response.data
}
export const updateUser = async (userId: string, data: Partial<AdminUser>): Promise<AdminApiResponse<AdminUser>> => {
  const response = await adminApi.put(`/users/${userId}`, data)
  return response.data
}
export const deleteUser = async (userId: string): Promise<AdminApiResponse<void>> => {
  const response = await adminApi.delete(`/users/${userId}`)
  return response.data
}

// --- Products ---
export const getProducts = async (params?: any): Promise<AdminApiResponse<AdminProduct[]>> => {
  const response = await adminApi.get('/products', { params })
  return response.data
}
export const getProduct = async (productId: string): Promise<AdminApiResponse<AdminProduct>> => {
  const response = await adminApi.get(`/products/${productId}`)
  return response.data
}
export const createProduct = async (data: Partial<AdminProduct>): Promise<AdminApiResponse<AdminProduct>> => {
  const response = await adminApi.post('/products', data)
  return response.data
}
export const updateProduct = async (productId: string, data: Partial<AdminProduct>): Promise<AdminApiResponse<AdminProduct>> => {
  const response = await adminApi.put(`/products/${productId}`, data)
  return response.data
}
export const deleteProduct = async (productId: string): Promise<AdminApiResponse<void>> => {
  const response = await adminApi.delete(`/products/${productId}`)
  return response.data
}

// --- Categories ---
export const getCategories = async (): Promise<AdminApiResponse<AdminCategory[]>> => {
  const response = await adminApi.get('/categories')
  return response.data
}
export const createCategory = async (data: Partial<AdminCategory>): Promise<AdminApiResponse<AdminCategory>> => {
  const response = await adminApi.post('/categories', data)
  return response.data
}
export const updateCategory = async (categoryId: string, data: Partial<AdminCategory>): Promise<AdminApiResponse<AdminCategory>> => {
  const response = await adminApi.put(`/categories/${categoryId}`, data)
  return response.data
}
export const deleteCategory = async (categoryId: string): Promise<AdminApiResponse<void>> => {
  const response = await adminApi.delete(`/categories/${categoryId}`)
  return response.data
}

// --- Orders ---
export const getOrders = async (params?: any): Promise<AdminApiResponse<AdminOrder[]>> => {
  const response = await adminApi.get('/orders', { params })
  return response.data
}
export const getOrder = async (orderId: string): Promise<AdminApiResponse<AdminOrder>> => {
  const response = await adminApi.get(`/orders/${orderId}`)
  return response.data
}
export const updateOrderStatus = async (orderId: string, status: string): Promise<AdminApiResponse<AdminOrder>> => {
  const response = await adminApi.put(`/orders/${orderId}/status`, { status })
  return response.data
}

// --- Inventory ---
export const getInventory = async (params?: any): Promise<AdminApiResponse<AdminProduct[]>> => {
  const response = await adminApi.get('/inventory', { params })
  return response.data
}
export const getLowStock = async (): Promise<AdminApiResponse<AdminProduct[]>> => {
  const response = await adminApi.get('/inventory/low-stock')
  return response.data
}
export const getOutOfStock = async (): Promise<AdminApiResponse<AdminProduct[]>> => {
  const response = await adminApi.get('/inventory/out-of-stock')
  return response.data
}
export const getInventoryTransactions = async (params?: any): Promise<AdminApiResponse<AdminInventoryTransaction[]>> => {
  const response = await adminApi.get('/inventory/transactions', { params })
  return response.data
}

// --- System Monitoring ---
export const getSystemOverview = async (): Promise<AdminApiResponse<any>> => {
  const response = await adminApi.get('/system/overview')
  return response.data
}
export const getSystemHealth = async (): Promise<AdminApiResponse<any>> => {
  const response = await adminApi.get('/system/health')
  return response.data
}
export const getSystemLogs = async (params?: any): Promise<AdminApiResponse<AdminSystemLog[]>> => {
  const response = await adminApi.get('/system/logs', { params })
  return response.data
}

// --- Activity Logs ---
export const getActivityLogs = async (params?: any): Promise<AdminApiResponse<AdminActivityLog[]>> => {
  const response = await adminApi.get('/activity-logs', { params })
  return response.data
}
export const getUserActivityLogs = async (userId: string): Promise<AdminApiResponse<AdminActivityLog[]>> => {
  const response = await adminApi.get(`/activity-logs/user/${userId}`)
  return response.data
}

// --- Reports ---
export const getSalesReport = async (params?: any): Promise<AdminApiResponse<AdminReport>> => {
  const response = await adminApi.get('/reports/sales', { params })
  return response.data
}
export const getInventoryReport = async (params?: any): Promise<AdminApiResponse<AdminReport>> => {
  const response = await adminApi.get('/reports/inventory', { params })
  return response.data
}
export const getUserReport = async (params?: any): Promise<AdminApiResponse<AdminReport>> => {
  const response = await adminApi.get('/reports/users', { params })
  return response.data
}

// --- Export ---
export const exportSales = async (params?: any): Promise<Blob> => {
  const response = await adminApi.get('/export/sales', { params, responseType: 'blob' })
  return response.data
}
export const exportInventory = async (params?: any): Promise<Blob> => {
  const response = await adminApi.get('/export/inventory', { params, responseType: 'blob' })
  return response.data
}
export const exportUsers = async (params?: any): Promise<Blob> => {
  const response = await adminApi.get('/export/users', { params, responseType: 'blob' })
  return response.data
}

// --- Review Moderation ---
export const getReviews = async (params?: any): Promise<AdminApiResponse<AdminReview[]>> => {
  const response = await adminApi.get('/reviews', { params })
  return response.data
}
export const moderateReview = async (reviewId: string, action: 'approve' | 'reject' | 'delete'): Promise<AdminApiResponse<AdminReview>> => {
  const response = await adminApi.post(`/reviews/${reviewId}/moderate`, { action })
  return response.data
}

// --- Excel Import/Export ---
export const importCategoriesFromExcel = async (file: File): Promise<AdminApiResponse<any>> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await adminApi.post('/categories/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response.data
}
export const exportCategoriesToExcel = async (): Promise<Blob> => {
  const response = await adminApi.get('/categories/export', { responseType: 'blob' })
  return response.data
}

export default {
  getDashboard,
  getDashboardStats,
  getProductStats,
  getUserStats,
  getOrderStats,
  getSalesAnalytics,
  getRevenueAnalytics,
  getProductAnalytics,
  getUserAnalytics,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrder,
  updateOrderStatus,
  getInventory,
  getLowStock,
  getOutOfStock,
  getInventoryTransactions,
  getSystemOverview,
  getSystemHealth,
  getSystemLogs,
  getActivityLogs,
  getUserActivityLogs,
  getSalesReport,
  getInventoryReport,
  getUserReport,
  exportSales,
  exportInventory,
  exportUsers,
  getReviews,
  moderateReview,
  importCategoriesFromExcel,
  exportCategoriesToExcel,
} 