import axios from 'axios'
import {
  ProductListResponse,
  ProductResponse,
  ProductCreateData,
  ProductUpdateData,
  ProductStatsResponse,
  LowStockProduct,
  OutOfStockProduct
} from '@/types/product/product'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Create axios instance for product API
const productApi = axios.create({
  baseURL: `${API_BASE_URL}/products`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
productApi.interceptors.request.use(
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

export const productService = {
  // Get all products with filters and pagination
  async getProducts(params: any = {}): Promise<ProductListResponse> {
    const response = await productApi.get('/', { params })
    return response.data
  },

  // Search products
  async searchProducts(params: any): Promise<ProductListResponse> {
    const response = await productApi.get('/search', { params })
    return response.data
  },

  // Get product by ID
  async getProductById(id: string): Promise<ProductResponse> {
    const response = await productApi.get(`/${id}`)
    return response.data
  },

  // Get product by slug
  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const response = await productApi.get(`/slug/${slug}`)
    return response.data
  },

  // Get products by category
  async getProductsByCategory(categoryId: string, params: any = {}): Promise<ProductListResponse> {
    const response = await productApi.get(`/category/${categoryId}`, { params })
    return response.data
  },

  // Get products by subcategory
  async getProductsBySubCategory(subCategoryId: string, params: any = {}): Promise<ProductListResponse> {
    const response = await productApi.get(`/subcategory/${subCategoryId}`, { params })
    return response.data
  },

  // Get featured products
  async getFeaturedProducts(limit: number = 10): Promise<ProductListResponse> {
    const response = await productApi.get('/featured', { params: { limit } })
    return response.data
  },

  // Get on-sale products
  async getOnSaleProducts(limit: number = 10): Promise<ProductListResponse> {
    const response = await productApi.get('/on-sale', { params: { limit } })
    return response.data
  },

  // Create product (Admin only)
  async createProduct(data: ProductCreateData): Promise<ProductResponse> {
    const response = await productApi.post('/', data)
    return response.data
  },

  // Update product (Admin only)
  async updateProduct(data: ProductUpdateData): Promise<ProductResponse> {
    const { id, ...updateData } = data
    const response = await productApi.put(`/${id}`, updateData)
    return response.data
  },

  // Delete product (Admin only)
  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const response = await productApi.delete(`/${id}`)
    return response.data
  },

  // Bulk import products (Admin only)
  async bulkImportProducts(file: File): Promise<{ success: boolean; message: string; data?: any }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await productApi.post('/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Export products to Excel (Admin only)
  async exportProducts(params: any = {}): Promise<Blob> {
    const response = await productApi.get('/export/excel', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  // Get product statistics (Admin only)
  async getProductStatistics(): Promise<ProductStatsResponse> {
    const response = await productApi.get('/stats/overview')
    return response.data
  },

  // Get low stock products (Admin only)
  async getLowStockProducts(): Promise<{ success: boolean; data: { products: LowStockProduct[] } }> {
    const response = await productApi.get('/stats/low-stock')
    return response.data
  },

  // Get out of stock products (Admin only)
  async getOutOfStockProducts(): Promise<{ success: boolean; data: { products: OutOfStockProduct[] } }> {
    const response = await productApi.get('/stats/out-of-stock')
    return response.data
  },

  // Update product stock (Admin only)
  async updateProductStock(productId: string, quantity: number, reason: string): Promise<ProductResponse> {
    const response = await productApi.put(`/${productId}/stock`, { quantity, reason })
    return response.data
  },

  // Get product inventory transactions (Admin only)
  async getProductInventoryTransactions(productId: string): Promise<{ success: boolean; data: { transactions: any[] } }> {
    const response = await productApi.get(`/${productId}/inventory-transactions`)
    return response.data
  },
}

export default productService 