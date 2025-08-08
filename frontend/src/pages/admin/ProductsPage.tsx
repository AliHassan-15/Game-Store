import React, { useEffect, useState, useRef } from 'react'
import { useAdminStore } from '@/store/slices/admin/adminSlice'


import { Button } from '@/components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card'
import { Input } from '@/components/ui/input/Input'
import { Badge } from '@/components/ui/badge/Badge'
import { Loader2, Plus, Search, Edit, Trash2, Eye, Package, DollarSign, AlertTriangle, Upload, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const ProductsPage: React.FC = () => {
  const {
    products,
    productsLoading,
    productsError,
    getProducts,
    deleteProduct,
  } = useAdminStore()

  // Authentication check (temporarily disabled for development)
  // const { isAuthenticated, user, accessToken } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProducts()
  }, [getProducts])

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId)
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError(null)
    setImportSuccess(null)
    try {
      // Note: This would need to be implemented in adminApi
      // await adminApi.importProductsFromExcel(file)
      setImportSuccess('Products imported successfully!')
      getProducts()
    } catch (error: any) {
      setImportError(error.message || 'Failed to import products')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      // Note: This would need to be implemented in adminApi
      // const blob = await adminApi.exportProductsToExcel()
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = 'products.xlsx'
      // document.body.appendChild(a)
      // a.click()
      // a.remove()
      // window.URL.revokeObjectURL(url)
      alert('Export functionality will be implemented')
    } catch (error) {
      alert('Failed to export products')
    } finally {
      setExporting(false)
    }
  }

  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive)
    return matchesSearch && matchesStatus
  })

  const getStockStatus = (stockQuantity: number, lowStockThreshold: number) => {
    if (stockQuantity === 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-800' }
    if (stockQuantity <= lowStockThreshold) return { status: 'low-stock', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'in-stock', color: 'bg-green-100 text-green-800' }
  }

  // Temporarily bypass authentication check for development
  // TODO: Remove this when proper authentication is implemented

  if (productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
          <Button asChild>
            <label className="flex items-center cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import Excel'}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImportExcel}
                disabled={importing}
              />
            </label>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{importError}</p>
        </div>
      )}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-600">{importSuccess}</p>
        </div>
      )}
      {productsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Error loading products: {productsError}</p>
          {productsError.includes('401') && (
            <p className="text-red-600 mt-2">Please make sure you are logged in as an admin user.</p>
          )}
          <Button 
            onClick={() => getProducts()} 
            className="mt-2"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Products ({filteredProducts.length})</span>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{products.length} total</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stockQuantity, product.lowStockThreshold)
                return (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.mainImage ? (
                          <img 
                            src={product.mainImage} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">{product.categoryName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {product.isFeatured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                          {product.isOnSale && (
                            <Badge variant="outline" className="text-orange-600">On Sale</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.comparePrice)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                          <Badge className={stockStatus.color}>
                            {stockStatus.status === 'out-of-stock' ? 'Out of Stock' :
                             stockStatus.status === 'low-stock' ? 'Low Stock' : 'In Stock'}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {product.stockQuantity} units
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No products match your filters' 
                  : 'No products found'}
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 