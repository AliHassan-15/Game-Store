import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Share2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent } from '@/components/ui/card/Card'
import { useProduct } from '@/hooks/product/useProducts'
import { useAuth } from '@/hooks/auth/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { product, isLoading, error } = useProduct(undefined, slug)
  const { isAuthenticated } = useAuth()
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (error) {
      console.error('Error loading product:', error)
    }
  }, [error])

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
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
    thumbnail,
    images,
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
    publisher,
    developer,
  } = product

  const isOutOfStock = stockQuantity === 0
  const isLowStock = stockQuantity <= 5 && stockQuantity > 0
  const hasDiscount = originalPrice && originalPrice > price
  const discountAmount = originalPrice ? originalPrice - price : 0

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }
    // TODO: Implement add to cart
    console.log('Add to cart:', { product, quantity })
  }

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      navigate('/auth')
      return
    }
    // TODO: Implement add to wishlist
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
      // TODO: Show toast notification
    }
  }

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === (images?.length || 1) - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? (images?.length || 1) - 1 : prev - 1
    )
  }

  const allImages = [thumbnail, ...(images || [])].filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <button onClick={() => navigate('/')} className="hover:text-gray-700">
              Home
            </button>
          </li>
          <li>/</li>
          <li>
            <button onClick={() => navigate('/products')} className="hover:text-gray-700">
              Products
            </button>
          </li>
          {category && (
            <>
              <li>/</li>
              <li>
                <button 
                  onClick={() => navigate(`/products?category=${category.id}`)} 
                  className="hover:text-gray-700"
                >
                  {category.name}
                </button>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-gray-900">{name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={allImages[selectedImageIndex] || '/placeholder-product.jpg'}
              alt={name}
              className="w-full h-full object-cover"
            />
            
            {/* Image Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Images */}
          {allImages.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === selectedImageIndex ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image || '/placeholder-product.jpg'}
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
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {category && (
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {category.name}
                </span>
              )}
              {isFeatured && (
                <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  Featured
                </span>
              )}
              {isOnSale && (
                <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                  On Sale
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
            
            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {rating.toFixed(1)} ({totalReviews || 0} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {formatCurrency(originalPrice!)}
                  </span>
                  <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                    Save {formatCurrency(discountAmount)}
                  </span>
                </>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <span className="text-red-600 text-sm">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-yellow-600 text-sm">Only {stockQuantity} left</span>
              ) : (
                <span className="text-green-600 text-sm">In Stock</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {/* Quantity */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 hover:bg-gray-100"
                  disabled={isOutOfStock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleAddToWishlist}
                size="lg"
              >
                <Heart className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleShare}
                size="lg"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>

          {/* Product Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {platform && (
                  <div>
                    <span className="font-medium text-gray-700">Platform:</span>
                    <span className="ml-2 text-gray-600">{platform}</span>
                  </div>
                )}
                {genre && (
                  <div>
                    <span className="font-medium text-gray-700">Genre:</span>
                    <span className="ml-2 text-gray-600">{genre}</span>
                  </div>
                )}
                {releaseDate && (
                  <div>
                    <span className="font-medium text-gray-700">Release Date:</span>
                    <span className="ml-2 text-gray-600">{formatDate(releaseDate)}</span>
                  </div>
                )}
                {publisher && (
                  <div>
                    <span className="font-medium text-gray-700">Publisher:</span>
                    <span className="ml-2 text-gray-600">{publisher}</span>
                  </div>
                )}
                {developer && (
                  <div>
                    <span className="font-medium text-gray-700">Developer:</span>
                    <span className="ml-2 text-gray-600">{developer}</span>
                  </div>
                )}
                {subCategory && (
                  <div>
                    <span className="font-medium text-gray-700">Subcategory:</span>
                    <span className="ml-2 text-gray-600">{subCategory.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 