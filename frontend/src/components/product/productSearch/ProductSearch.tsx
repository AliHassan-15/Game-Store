import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { Input } from '@/components/ui/input/Input'
import { Card, CardContent } from '@/components/ui/card/Card'
import { useProductSearch, useProductFilters } from '@/hooks/product/useProducts'
import { debounce } from '@/lib/utils'

interface ProductSearchProps {
  placeholder?: string
  showFilters?: boolean
  className?: string
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  placeholder = "Search games...",
  showFilters = true,
  className = '',
}) => {
  const { searchQuery, setSearchQuery, isSearching } = useProductSearch()
  const { 
    filters, 
    setFilters, 
    clearFilters, 
    categories, 
    subCategories,
    hasActiveFilters 
  } = useProductFilters()
  
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query)
  }, 300)

  useEffect(() => {
    debouncedSearch(localSearchQuery)
  }, [localSearchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value)
  }

  const handleClearSearch = () => {
    setLocalSearchQuery('')
    setSearchQuery('')
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    })
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localSearchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-10"
          disabled={isSearching}
        />
        {localSearchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      {showFilters && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${
                showFilterPanel ? 'rotate-180' : ''
              }`} 
            />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <select
                    value={filters.subCategory || ''}
                    onChange={(e) => handleFilterChange('subCategory', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!filters.category}
                  >
                    <option value="">All Subcategories</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={filters.platform || ''}
                    onChange={(e) => handleFilterChange('platform', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Platforms</option>
                    <option value="PC">PC</option>
                    <option value="PlayStation">PlayStation</option>
                    <option value="Xbox">Xbox</option>
                    <option value="Nintendo">Nintendo</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating || ''}
                    onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                    <option value="1">1+ Stars</option>
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock === true}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked ? true : undefined)}
                        className="mr-2"
                      />
                      In Stock
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.isOnSale === true}
                        onChange={(e) => handleFilterChange('isOnSale', e.target.checked ? true : undefined)}
                        className="mr-2"
                      />
                      On Sale
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.isFeatured === true}
                        onChange={(e) => handleFilterChange('isFeatured', e.target.checked ? true : undefined)}
                        className="mr-2"
                      />
                      Featured
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null
            
            let displayValue = value
            if (key === 'category') {
              const category = categories.find(c => c.id === value)
              displayValue = category?.name || value
            } else if (key === 'subCategory') {
              const subCategory = subCategories.find(s => s.id === value)
              displayValue = subCategory?.name || value
            } else if (key === 'rating') {
              displayValue = `${value}+ Stars`
            } else if (typeof value === 'boolean') {
              displayValue = value ? 'Yes' : 'No'
            }

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {key}: {displayValue}
                <button
                  onClick={() => handleFilterChange(key, undefined)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
} 