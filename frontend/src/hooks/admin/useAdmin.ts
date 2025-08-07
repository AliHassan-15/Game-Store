import { useAdminStore } from '@/store/slices/admin/adminSlice'

export const useAdmin = () => {
  const {
    dashboardStats,
    users,
    orders,
    products,
    isLoading,
    error,
    getDashboardStats,
    getUsers,
    getOrders,
    getProducts,
    clearError,
    setError,
  } = useAdminStore()

  return {
    // State
    dashboardStats,
    users,
    orders,
    products,
    isLoading,
    error,

    // Actions
    getDashboardStats,
    getUsers,
    getOrders,
    getProducts,
    clearError,
    setError,
  }
} 