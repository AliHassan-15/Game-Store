export interface AdminDashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  recentOrders: number
  lowStockProducts: number
  averageRating: number
  totalViews: number
  recentOrdersList?: AdminOrder[]
  topProducts?: AdminProduct[]
  recentActivities?: AdminActivityLog[]
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'buyer'
  isActive: boolean
  isVerified: boolean
  phone?: string
  avatar?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface AdminOrder {
  id: string
  orderNumber: string
  userId: string
  userEmail: string
  userFirstName: string
  userLastName: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  totalAmount: number
  subtotal: number
  tax: number
  shipping: number
  shippingMethod: string
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
  items: AdminOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface AdminOrderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  comparePrice?: number
  sku: string
  stockQuantity: number
  lowStockThreshold: number
  isActive: boolean
  isFeatured: boolean
  isOnSale: boolean
  categoryId: string
  categoryName: string
  subCategoryId?: string
  subCategoryName?: string
  mainImage: string
  images: string[]
  specifications: Record<string, any>
  platform: string
  genre: string
  releaseDate: string
  publisher: string
  developer: string
  viewCount: number
  soldCount: number
  averageRating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminCategory {
  id: string
  name: string
  description: string
  slug: string
  isActive: boolean
  productCount: number
  subCategories: AdminSubCategory[]
  createdAt: string
  updatedAt: string
}

export interface AdminSubCategory {
  id: string
  name: string
  description: string
  slug: string
  categoryId: string
  categoryName: string
  isActive: boolean
  productCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminReview {
  id: string
  userId: string
  userEmail: string
  userFirstName: string
  userLastName: string
  productId: string
  productName: string
  rating: number
  title: string
  content: string
  isVerified: boolean
  isActive: boolean
  isModerated: boolean
  moderationStatus: 'pending' | 'approved' | 'rejected'
  moderationNotes?: string
  createdAt: string
  updatedAt: string
}

export interface AdminInventoryTransaction {
  id: string
  productId: string
  productName: string
  transactionType: 'stock_in' | 'stock_out' | 'adjustment' | 'return'
  quantity: number
  stockBefore: number
  stockAfter: number
  referenceType: 'manual' | 'order' | 'return' | 'adjustment'
  reference: string
  reason: string
  metadata: Record<string, any>
  createdAt: string
}

export interface AdminSystemLog {
  id: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  timestamp: string
  context: Record<string, any>
}

export interface AdminReport {
  id: string
  type: 'sales' | 'inventory' | 'users' | 'reviews'
  title: string
  description: string
  data: Record<string, any>
  filters: Record<string, any>
  generatedAt: string
  generatedBy: string
}

export interface AdminAnalytics {
  salesData: {
    date: string
    revenue: number
    orders: number
  }[]
  topProducts: {
    productId: string
    productName: string
    sales: number
    revenue: number
  }[]
  topCategories: {
    categoryId: string
    categoryName: string
    sales: number
    revenue: number
  }[]
  userGrowth: {
    date: string
    newUsers: number
    totalUsers: number
  }[]
  revenueAnalytics: {
    totalRevenue: number
    monthlyRevenue: number
    averageOrderValue: number
    revenueGrowth: number
  }
  productAnalytics: {
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    averageRating: number
  }
  userAnalytics: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    userGrowthRate: number
  }
}

export interface AdminActivityLog {
  id: string
  userId: string
  userEmail: string
  userFirstName: string
  userLastName: string
  action: string
  resource: string
  resourceId?: string
  details: string
  ipAddress: string
  userAgent: string
  metadata: Record<string, any>
  createdAt: string
}

export interface AdminFilters {
  dateRange?: {
    start: string
    end: string
  }
  status?: string
  category?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AdminExcelImportData {
  categories?: AdminCategory[]
  products?: AdminProduct[]
  success: boolean
  message: string
  imported: number
  failed: number
  errors?: string[]
} 