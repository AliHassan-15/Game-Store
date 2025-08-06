import { create } from 'zustand'
import { Product, Category, SubCategory, ProductSearchParams, ProductFilters } from '@/types/product/product'
import productService from '@/services/api/products/productApi'
import categoryService from '@/services/api/products/categoryApi'

interface ProductState {
  // Products
  products: Product[]
  featuredProducts: Product[]
  onSaleProducts: Product[]
  currentProduct: Product | null
  
  // Categories
  categories: Category[]
  subCategories: SubCategory[]
  currentCategory: Category | null
  currentSubCategory: SubCategory | null
  
  // Search and Filters
  searchQuery: string
  filters: ProductFilters
  sortBy: 'name' | 'price' | 'rating' | 'createdAt' | 'releaseDate'
  sortOrder: 'asc' | 'desc'
  
  // Pagination
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  
  // Loading States
  isLoading: boolean
  isSearching: boolean
  isFiltering: boolean
  
  // Error State
  error: string | null
}

interface ProductStore extends ProductState {
  // Product Actions
  fetchProducts: (params?: ProductSearchParams) => Promise<void>
  fetchProductById: (id: string) => Promise<void>
  fetchProductBySlug: (slug: string) => Promise<void>
  fetchFeaturedProducts: (limit?: number) => Promise<void>
  fetchOnSaleProducts: (limit?: number) => Promise<void>
  
  // Category Actions
  fetchCategories: () => Promise<void>
  fetchSubCategories: (categoryId: string) => Promise<void>
  setCurrentCategory: (category: Category | null) => void
  setCurrentSubCategory: (subCategory: SubCategory | null) => void
  
  // Search and Filter Actions
  setSearchQuery: (query: string) => void
  setFilters: (filters: ProductFilters) => void
  clearFilters: () => void
  setSortBy: (sortBy: ProductState['sortBy']) => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  
  // Pagination Actions
  setCurrentPage: (page: number) => void
  setItemsPerPage: (itemsPerPage: number) => void
  
  // Utility Actions
  clearError: () => void
  setLoading: (loading: boolean) => void
  resetState: () => void
}

const initialState: ProductState = {
  // Products
  products: [],
  featuredProducts: [],
  onSaleProducts: [],
  currentProduct: null,
  
  // Categories
  categories: [],
  subCategories: [],
  currentCategory: null,
  currentSubCategory: null,
  
  // Search and Filters
  searchQuery: '',
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
  
  // Pagination
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 20,
  
  // Loading States
  isLoading: false,
  isSearching: false,
  isFiltering: false,
  
  // Error State
  error: null,
}

export const useProductStore = create<ProductStore>((set, get) => ({
  ...initialState,

  // Fetch products with filters and pagination
  fetchProducts: async (params: ProductSearchParams = {}) => {
    try {
      set({ isLoading: true, error: null })
      
      const searchParams: ProductSearchParams = {
        page: get().currentPage,
        limit: get().itemsPerPage,
        sortBy: get().sortBy,
        sortOrder: get().sortOrder,
        search: get().searchQuery || undefined,
        filters: get().filters,
        ...params,
      }
      
      const response = await productService.getProducts(searchParams)
      
      if (response.success) {
        set({
          products: response.data.products,
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage,
          isLoading: false,
        })
      } else {
        set({
          isLoading: false,
          error: 'Failed to fetch products',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch products',
      })
    }
  },

  // Fetch product by ID
  fetchProductById: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await productService.getProductById(id)
      
      if (response.success) {
        set({
          currentProduct: response.data.product,
          isLoading: false,
        })
      } else {
        set({
          isLoading: false,
          error: 'Failed to fetch product',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch product',
      })
    }
  },

  // Fetch product by slug
  fetchProductBySlug: async (slug: string) => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await productService.getProductBySlug(slug)
      
      if (response.success) {
        set({
          currentProduct: response.data.product,
          isLoading: false,
        })
      } else {
        set({
          isLoading: false,
          error: 'Failed to fetch product',
        })
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch product',
      })
    }
  },

  // Fetch featured products
  fetchFeaturedProducts: async (limit: number = 10) => {
    try {
      const response = await productService.getFeaturedProducts(limit)
      
      if (response.success) {
        set({
          featuredProducts: response.data.products,
        })
      }
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
    }
  },

  // Fetch on-sale products
  fetchOnSaleProducts: async (limit: number = 10) => {
    try {
      const response = await productService.getOnSaleProducts(limit)
      
      if (response.success) {
        set({
          onSaleProducts: response.data.products,
        })
      }
    } catch (error) {
      console.error('Failed to fetch on-sale products:', error)
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const response = await categoryService.getCategories()
      
      if (response.success) {
        set({
          categories: response.data.categories,
        })
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  },

  // Fetch subcategories by category
  fetchSubCategories: async (categoryId: string) => {
    try {
      const response = await categoryService.getSubCategoriesByCategory(categoryId)
      
      if (response.success) {
        set({
          subCategories: response.data.subCategories,
        })
      }
    } catch (error) {
      console.error('Failed to fetch subcategories:', error)
    }
  },

  // Set current category
  setCurrentCategory: (category: Category | null) => {
    set({ currentCategory: category })
    if (category) {
      get().fetchSubCategories(category.id)
    } else {
      set({ subCategories: [] })
    }
  },

  // Set current subcategory
  setCurrentSubCategory: (subCategory: SubCategory | null) => {
    set({ currentSubCategory: subCategory })
  },

  // Set search query
  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 })
    get().fetchProducts()
  },

  // Set filters
  setFilters: (filters: ProductFilters) => {
    set({ filters, currentPage: 1 })
    get().fetchProducts()
  },

  // Clear filters
  clearFilters: () => {
    set({ 
      filters: {}, 
      searchQuery: '', 
      currentPage: 1,
      currentCategory: null,
      currentSubCategory: null,
    })
    get().fetchProducts()
  },

  // Set sort by
  setSortBy: (sortBy: ProductState['sortBy']) => {
    set({ sortBy, currentPage: 1 })
    get().fetchProducts()
  },

  // Set sort order
  setSortOrder: (sortOrder: 'asc' | 'desc') => {
    set({ sortOrder, currentPage: 1 })
    get().fetchProducts()
  },

  // Set current page
  setCurrentPage: (page: number) => {
    set({ currentPage: page })
    get().fetchProducts()
  },

  // Set items per page
  setItemsPerPage: (itemsPerPage: number) => {
    set({ itemsPerPage, currentPage: 1 })
    get().fetchProducts()
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },

  // Set loading
  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  // Reset state
  resetState: () => {
    set(initialState)
  },
})) 