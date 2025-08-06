import { useEffect } from 'react'
import { useProductStore } from '@/store/slices/product/productSlice'
import { ProductSearchParams, ProductFilters } from '@/types/product/product'

export const useProducts = () => {
  const {
    // State
    products,
    featuredProducts,
    onSaleProducts,
    currentProduct,
    categories,
    subCategories,
    currentCategory,
    currentSubCategory,
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isLoading,
    isSearching,
    isFiltering,
    error,
    
    // Actions
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    fetchFeaturedProducts,
    fetchOnSaleProducts,
    fetchCategories,
    fetchSubCategories,
    setCurrentCategory,
    setCurrentSubCategory,
    setSearchQuery,
    setFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setItemsPerPage,
    clearError,
    setLoading,
    resetState,
  } = useProductStore()

  // Initialize data on mount
  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchFeaturedProducts()
    fetchOnSaleProducts()
  }, [])

  return {
    // State
    products,
    featuredProducts,
    onSaleProducts,
    currentProduct,
    categories,
    subCategories,
    currentCategory,
    currentSubCategory,
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isLoading,
    isSearching,
    isFiltering,
    error,
    
    // Actions
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    fetchFeaturedProducts,
    fetchOnSaleProducts,
    fetchCategories,
    fetchSubCategories,
    setCurrentCategory,
    setCurrentSubCategory,
    setSearchQuery,
    setFilters,
    clearFilters,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setItemsPerPage,
    clearError,
    setLoading,
    resetState,
    
    // Computed values
    hasProducts: products.length > 0,
    hasFeaturedProducts: featuredProducts.length > 0,
    hasOnSaleProducts: onSaleProducts.length > 0,
    hasCategories: categories.length > 0,
    hasSubCategories: subCategories.length > 0,
    hasFilters: Object.keys(filters).length > 0,
    hasSearchQuery: searchQuery.trim().length > 0,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalPagesArray: Array.from({ length: totalPages }, (_, i) => i + 1),
  }
}

// Hook for product details
export const useProduct = (productId?: string, productSlug?: string) => {
  const { currentProduct, fetchProductById, fetchProductBySlug, isLoading, error } = useProductStore()

  useEffect(() => {
    if (productId) {
      fetchProductById(productId)
    } else if (productSlug) {
      fetchProductBySlug(productSlug)
    }
  }, [productId, productSlug])

  return {
    product: currentProduct,
    isLoading,
    error,
    fetchProductById,
    fetchProductBySlug,
  }
}

// Hook for product search
export const useProductSearch = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    isSearching, 
    products: searchResults,
    totalItems: searchTotalItems 
  } = useProductStore()

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    searchTotalItems,
    hasSearchResults: searchResults.length > 0,
  }
}

// Hook for product filters
export const useProductFilters = () => {
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    isFiltering,
    categories,
    subCategories,
    currentCategory,
    currentSubCategory,
    setCurrentCategory,
    setCurrentSubCategory,
  } = useProductStore()

  return {
    filters,
    setFilters,
    clearFilters,
    isFiltering,
    categories,
    subCategories,
    currentCategory,
    currentSubCategory,
    setCurrentCategory,
    setCurrentSubCategory,
    hasActiveFilters: Object.keys(filters).length > 0,
  }
}

// Hook for product pagination
export const useProductPagination = () => {
  const { 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
  } = useProductStore()

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalPagesArray: Array.from({ length: totalPages }, (_, i) => i + 1),
    startItem: (currentPage - 1) * itemsPerPage + 1,
    endItem: Math.min(currentPage * itemsPerPage, totalItems),
  }
} 