import React, { useEffect, useRef, useState } from 'react'
import { useAdminStore } from '@/store/slices/admin/adminSlice'
import * as adminApi from '@/services/api/admin/adminApi'
import { Button } from '@/components/ui/button/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/Card'
import { Loader2, Upload, Download, Plus, FileSpreadsheet, Folder } from 'lucide-react'

import { Badge } from '@/components/ui/badge/Badge'

export const CategoriesPage: React.FC = () => {
  const {
    categories,
    categoriesLoading,
    categoriesError,
    getCategories,
  } = useAdminStore()

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCategories()
  }, [getCategories])

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError(null)
    setImportSuccess(null)
    try {
      await adminApi.importCategoriesFromExcel(file)
      setImportSuccess('Categories imported successfully!')
      getCategories()
    } catch (error: any) {
      setImportError(error.message || 'Failed to import categories')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const blob = await adminApi.exportCategoriesToExcel()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'categories.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert('Failed to export categories')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
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
        </div>
      </div>

      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{importError}</p>
        </div>
      )}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-600">{importSuccess}</p>
        </div>
      )}
      {categoriesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{categoriesError}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-600" />
            Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading categories...</span>
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{cat.name}</h3>
                    <p className="text-sm text-gray-600">{cat.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge>{cat.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Badge variant="secondary">{cat.productCount} products</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                      Add Subcategory
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No categories found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}