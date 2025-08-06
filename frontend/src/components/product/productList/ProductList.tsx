import React from 'react'
import { motion } from 'framer-motion'
import { Product } from '@/types/product/product'
import { ProductCard } from '../productCard/ProductCard'
import { useProducts } from '@/hooks/product/useProducts'

interface ProductListProps {
  products?: Product[]
  title?: string
  subtitle?: string
  showFilters?: boolean
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  onViewDetails?: (product: Product) => void
  className?: string
}

export const ProductList: React.FC<ProductListProps> = ({
  products: propProducts,
  title,
  subtitle,
  showFilters = false,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  className = '',
}) => {
  const { products: storeProducts, isLoading, error } = useProducts()
  
  // Use provided products or store products
  const products = propProducts || storeProducts

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 ${className}`}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
        <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-8">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
      )}

      {/* Product Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            <ProductCard
              product={product}
              onAddToCart={onAddToCart}
              onAddToWishlist={onAddToWishlist}
              onViewDetails={onViewDetails}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Results Count */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Showing {products.length} of {products.length} products
      </div>
    </div>
  )
}

// Featured Products List
export const FeaturedProductsList: React.FC<Omit<ProductListProps, 'products'>> = (props) => {
  const { featuredProducts, hasFeaturedProducts } = useProducts()

  if (!hasFeaturedProducts) {
    return null
  }

  return (
    <ProductList
      products={featuredProducts}
      title="Featured Products"
      subtitle="Handpicked games you'll love"
      {...props}
    />
  )
}

// On Sale Products List
export const OnSaleProductsList: React.FC<Omit<ProductListProps, 'products'>> = (props) => {
  const { onSaleProducts, hasOnSaleProducts } = useProducts()

  if (!hasOnSaleProducts) {
    return null
  }

  return (
    <ProductList
      products={onSaleProducts}
      title="On Sale"
      subtitle="Great deals on amazing games"
      {...props}
    />
  )
} 