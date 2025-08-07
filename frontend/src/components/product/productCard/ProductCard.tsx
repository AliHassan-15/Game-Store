import React from 'react'
import { motion } from 'framer-motion'
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import { Product } from '@/types/product/product'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent, CardFooter } from '@/components/ui/card/Card'
import { formatCurrency, truncate } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  onViewDetails?: (product: Product) => void
  className?: string
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  className = '',
}) => {
  const {
    name,
    price,
    originalPrice,
    thumbnail,
    images,
    rating,
    totalReviews,
    stockQuantity,
    isOnSale,
    isFeatured,
    category,
  } = product

  const isOutOfStock = stockQuantity === 0
  const isLowStock = stockQuantity <= 5 && stockQuantity > 0
  const hasDiscount = originalPrice && originalPrice > price
  const discountAmount = originalPrice ? originalPrice - price : 0

  const handleAddToCart = () => {
    if (!isOutOfStock && onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product)
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group ${className}`}
    >
      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={thumbnail || images[0] || '/placeholder-product.jpg'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isFeatured && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Featured
              </span>
            )}
            {isOnSale && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Sale
              </span>
            )}
            {hasDiscount && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                -{Math.round((discountAmount / originalPrice!) * 100)}%
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="absolute top-2 right-2">
            {isOutOfStock ? (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Low Stock
              </span>
            ) : null}
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8"
              onClick={handleViewDetails}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8"
              onClick={handleAddToWishlist}
              title="Add to Wishlist"
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <CardContent className="p-4">
          {/* Category */}
          {category && (
            <p className="text-xs text-gray-500 mb-1">{category.name}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {truncate(name, 50)}
          </h3>

          {/* Rating */}
          {rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({totalReviews || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-lg text-gray-900">
              {formatCurrency(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(originalPrice!)}
              </span>
            )}
          </div>
        </CardContent>

        {/* Actions */}
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
} 