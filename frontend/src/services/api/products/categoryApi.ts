import axios from 'axios'
import { Category, SubCategory } from '@/types/product/product'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance for category API
const categoryApi = axios.create({
  baseURL: `${API_BASE_URL}/categories`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
categoryApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<{ success: boolean; data: { categories: Category[] } }> {
    const response = await categoryApi.get('/')
    return response.data
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<{ success: boolean; data: { category: Category } }> {
    const response = await categoryApi.get(`/${id}`)
    return response.data
  },

  // Get category by slug
  async getCategoryBySlug(slug: string): Promise<{ success: boolean; data: { category: Category } }> {
    const response = await categoryApi.get(`/slug/${slug}`)
    return response.data
  },

  // Create category (Admin only)
  async createCategory(data: { name: string; description?: string; image?: string }): Promise<{ success: boolean; data: { category: Category } }> {
    const response = await categoryApi.post('/', data)
    return response.data
  },

  // Update category (Admin only)
  async updateCategory(id: string, data: { name?: string; description?: string; image?: string; isActive?: boolean }): Promise<{ success: boolean; data: { category: Category } }> {
    const response = await categoryApi.put(`/${id}`, data)
    return response.data
  },

  // Delete category (Admin only)
  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await categoryApi.delete(`/${id}`)
    return response.data
  },

  // Get subcategories by category ID
  async getSubCategoriesByCategory(categoryId: string): Promise<{ success: boolean; data: { subCategories: SubCategory[] } }> {
    const response = await categoryApi.get(`/${categoryId}/subcategories`)
    return response.data
  },

  // Create subcategory (Admin only)
  async createSubCategory(data: { name: string; description?: string; categoryId: string }): Promise<{ success: boolean; data: { subCategory: SubCategory } }> {
    const response = await categoryApi.post('/subcategories', data)
    return response.data
  },

  // Update subcategory (Admin only)
  async updateSubCategory(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<{ success: boolean; data: { subCategory: SubCategory } }> {
    const response = await categoryApi.put(`/subcategories/${id}`, data)
    return response.data
  },

  // Delete subcategory (Admin only)
  async deleteSubCategory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await categoryApi.delete(`/subcategories/${id}`)
    return response.data
  },

  // Bulk import categories from Excel (Admin only)
  async bulkImportCategories(file: File): Promise<{ success: boolean; message: string; data?: any }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await categoryApi.post('/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Export categories to Excel (Admin only)
  async exportCategories(): Promise<Blob> {
    const response = await categoryApi.get('/export/excel', {
      responseType: 'blob',
    })
    return response.data
  },

  // Get category statistics (Admin only)
  async getCategoryStatistics(): Promise<{ success: boolean; data: { statistics: any } }> {
    const response = await categoryApi.get('/stats')
    return response.data
  },
}

export default categoryService 