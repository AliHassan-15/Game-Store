import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Tag,
  Calendar,
  Gamepad2,
  Users,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card'
import { useProduct } from '@/hooks/product/useProducts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Product } from '@/types/product/product'

export const ProductDetailPage: React.FC = () => {
  const { productId, productSlug } = useParams<{ productId?: string; productSlug?: string }>()
  const navigate = useNavigate()
  const { product, isLoading, error } = useProduct(productId, productSlug)
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 aspect-square rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const {
    name,
    description,
    price,
    originalPrice,
    discountPercentage,
    images,
    thumbnail,
    rating,
    totalReviews,
    stockQuantity,
    isOnSale,
    isFeatured,
    category,
    subCategory,
    platform,
    genre,
    releaseDate,
    developer,
    publisher,
    reviews,
  } = product

  const isOutOfStock = stockQuantity === 0
  const isLowStock = stockQuantity <= 5 && stockQuantity > 0
  const hasDiscount = originalPrice && originalPrice > price
  const discountAmount = originalPrice ? originalPrice - price : 0
  const discountPercentageCalculated = originalPrice ? Math.round((discountAmount / originalPrice) * 100) : 0

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      // TODO: Implement add to cart functionality
      console.log('Add to cart:', { product, quantity })
    }
  }

  const handleAddToWishlist = () => {
    // TODO: Implement add to wishlist functionality
    console.log('Add to wishlist:', product)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: name,
        text: description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === (images?.length || 1) - 1 ? 0 : prev + 1
    )
  }

  const previousImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? (images?.length || 1) - 1 : prev - 1
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-gray-700">
          Home
        </button>
        <span>/</span>
        <button onClick={() => navigate('/products')} className="hover:text-gray-700">
          Products
        </button>
        {category && (
          <>
            <span>/</span>
            <button 
              onClick={() => navigate(`/products?category=${category.id}`)} 
              className="hover:text-gray-700"
            >
              {category.name}
            </button>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={images?.[selectedImageIndex] || thumbnail || '/placeholder-product.jpg'}
              alt={name}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            {images && images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
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
                  -{discountPercentageCalculated}%
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="absolute top-4 right-4">
              {isOutOfStock ? (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  Low Stock
                </span>
              ) : (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Images */}
          {images && images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === selectedImageIndex ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title and Rating */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            
            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {rating.toFixed(1)} ({totalReviews || 0} reviews)
                </span>
              </div>
            )}

            {/* Category */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              {category && (
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {category.name}
                </span>
              )}
              {subCategory && (
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {subCategory.name}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(price)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-500 line-through">
                  {formatCurrency(originalPrice!)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-green-600 font-medium">
                Save {formatCurrency(discountAmount)} ({discountPercentageCalculated}% off)
              </p>
            )}
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Platform:</span>
                  <span>{platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Genre:</span>
                  <span>{genre}</span>
                </div>
                {releaseDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Release Date:</span>
                    <span>{formatDate(releaseDate)}</span>
                  </div>
                )}
                {developer && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Developer:</span>
                    <span>{developer}</span>
                  </div>
                )}
                {publisher && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Publisher:</span>
                    <span>{publisher}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Info */}
          <div className="text-sm text-gray-600">
            {isOutOfStock ? (
              <p className="text-red-600 font-medium">Currently out of stock</p>
            ) : isLowStock ? (
              <p className="text-yellow-600 font-medium">Only {stockQuantity} left in stock</p>
            ) : (
              <p className="text-green-600 font-medium">{stockQuantity} in stock</p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                  disabled={quantity >= stockQuantity}
                >
                  +
                </button>
              </div>
              
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddToWishlist}
                className="flex-1"
              >
                <Heart className="w-4 h-4 mr-2" />
                Add to Wishlist
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        by {review.user?.firstName} {review.user?.lastName}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium mb-1">{review.title}</h4>
                    )}
                    {review.comment && (
                      <p className="text-gray-700 text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 