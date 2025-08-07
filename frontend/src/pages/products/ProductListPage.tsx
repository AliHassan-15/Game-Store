import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Grid3X3, 
  List, 
  ChevronLeft, 
  ChevronRight,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent } from '@/components/ui/card/Card'
import { ProductSearch } from '@/components/product/productSearch/ProductSearch'
import { ProductList } from '@/components/product/productList/ProductList'
import { useProducts, useProductPagination } from '@/hooks/product/useProducts'
import { Product } from '@/types/product/product'

export const ProductListPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    products, 
    isLoading, 
    error, 
    sortBy, 
    sortOrder,
    setSortBy, 
    setSortOrder,
    clearFilters 
  } = useProducts()
  
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    isFirstPage,
    isLastPage,
    totalPagesArray,
    startItem,
    endItem,
  } = useProductPagination()

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', product)
  }

  // Handle add to wishlist
  const handleAddToWishlist = (product: Product) => {
    // TODO: Implement add to wishlist functionality
    console.log('Add to wishlist:', product)
  }

  // Handle view details
  const handleViewDetails = (product: Product) => {
    navigate(`/products/${product.slug}`)
  }

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Games</h1>
        <p className="text-gray-600">
          Discover amazing games for all platforms
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <ProductSearch 
          placeholder="Search games by name, genre, or platform..."
          showFilters={true}
        />
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {isLoading ? (
            'Loading...'
          ) : (
            `Showing ${startItem}-${endItem} of ${totalItems} products`
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="releaseDate">Release Date</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="mb-8">
        <ProductList
          products={products}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
          onViewDetails={handleViewDetails}
          className={viewMode === 'list' ? 'space-y-4' : ''}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Pagination Info */}
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={isFirstPage}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {totalPagesArray.map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const shouldShow = 
                      page === 1 ||
                      page === totalPages ||
                      page === currentPage ||
                      Math.abs(page - currentPage) <= 1

                    if (shouldShow) {
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={isLastPage}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
          <Button onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
} 