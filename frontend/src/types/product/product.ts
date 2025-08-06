export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  categoryId: string
  subCategoryId?: string
  platform: string
  genre: string
  releaseDate?: string
  developer?: string
  publisher?: string
  rating?: number
  totalReviews?: number
  stockQuantity: number
  isActive: boolean
  isFeatured: boolean
  isOnSale: boolean
  images: string[]
  thumbnail: string
  createdAt: string
  updatedAt: string
  
  // Relations
  category?: Category
  subCategory?: SubCategory
  reviews?: Review[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Relations
  subCategories?: SubCategory[]
  products?: Product[]
}

export interface SubCategory {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Relations
  category?: Category
  products?: Product[]
}

export interface Review {
  id: string
  productId: string
  userId: string
  orderId?: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  
  // Relations
  product?: Product
  user?: User
  order?: Order
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export interface Order {
  id: string
  orderNumber: string
  status: string
}

// Product Filter and Search Types
export interface ProductFilters {
  category?: string
  subCategory?: string
  platform?: string
  genre?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  isOnSale?: boolean
  isFeatured?: boolean
  inStock?: boolean
}

export interface ProductSearchParams {
  search?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt' | 'releaseDate'
  sortOrder?: 'asc' | 'desc'
  filters?: ProductFilters
}

export interface ProductListResponse {
  success: boolean
  data: {
    products: Product[]
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
    }
  }
}

export interface ProductResponse {
  success: boolean
  data: {
    product: Product
  }
}

export interface ProductCreateData {
  name: string
  description: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  categoryId: string
  subCategoryId?: string
  platform: string
  genre: string
  releaseDate?: string
  developer?: string
  publisher?: string
  stockQuantity: number
  isActive?: boolean
  isFeatured?: boolean
  isOnSale?: boolean
  images?: string[]
  thumbnail?: string
}

export interface ProductUpdateData extends Partial<ProductCreateData> {
  id: string
}

// Product Statistics Types
export interface ProductStatistics {
  totalProducts: number
  activeProducts: number
  featuredProducts: number
  onSaleProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalCategories: number
  totalSubCategories: number
  averageRating: number
  totalReviews: number
}

export interface ProductStatsResponse {
  success: boolean
  data: {
    statistics: ProductStatistics
  }
}

// Inventory Types
export interface InventoryTransaction {
  id: string
  productId: string
  userId?: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  notes?: string
  createdAt: string
  
  // Relations
  product?: Product
  user?: User
}

export interface LowStockProduct {
  product: Product
  currentStock: number
  threshold: number
  lastRestocked?: string
}

export interface OutOfStockProduct {
  product: Product
  lastInStock?: string
  daysOutOfStock: number
} 