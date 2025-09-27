'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { productsApi } from '@/lib/api'
import type { Product, PaginatedResponse, SearchFilters } from '@/types'

interface ProductsPageState {
  products: Product[]
  loading: boolean
  error: string | null
  filters: SearchFilters
  total: number
  totalPages: number
  selectedProducts: string[]
}

function ProductRow({ product, onSelect, isSelected, onDelete }: {
  product: Product
  onSelect: (id: string) => void
  isSelected: boolean
  onDelete: (id: string, name: string) => void
}) {
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' }
    if (stock <= threshold) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' }
  }

  const stockStatus = getStockStatus(product.stock, product.low_stock_threshold)

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(product.id)}
          className="rounded border-gray-300 text-black focus:ring-black"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-10 h-10 rounded object-cover mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-black">{product.name}</p>
            <p className="text-sm text-gray-500 max-w-xs truncate">
              {product.description || 'No description'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black">
        ${parseFloat(String(product.price || 0)).toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
          {stockStatus.text} ({product.stock})
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {product.categories?.map(cat => cat.name).join(', ') || 'Uncategorized'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(product.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Link 
            href={`/products/${product.id}`}
            className="text-black hover:text-gray-600"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link 
            href={`/products/${product.id}/edit`}
            className="text-black hover:text-gray-600"
            title="Edit product"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => onDelete(product.id, product.name)}
            className="text-red-600 hover:text-red-800"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ProductsPage() {
  const [state, setState] = useState<ProductsPageState>({
    products: [],
    loading: true,
    error: null,
    filters: {
      search: '',
      category: '',
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    total: 0,
    totalPages: 0,
    selectedProducts: []
  })

  const fetchProducts = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Convert filters to string record
      const filtersAsStrings = Object.fromEntries(
        Object.entries(state.filters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, String(value)])
      )
      
      const response = await productsApi.getAll(filtersAsStrings)
      
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Product>
        setState(prev => ({
          ...prev,
          products: data.data || [],
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load products',
          loading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load products',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [state.filters])

  const handleSearch = (search: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search, page: 1 }
    }))
  }

  const handleSelectProduct = (productId: string) => {
    setState(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId]
    }))
  }

  const handleSelectAll = () => {
    setState(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.length === prev.products.length 
        ? [] 
        : prev.products.map(p => p.id)
    }))
  }

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, page }
    }))
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Remove from local state
        setState(prev => ({
          ...prev,
          products: prev.products.filter(p => p.id !== productId),
          selectedProducts: prev.selectedProducts.filter(id => id !== productId),
          total: prev.total - 1
        }))
        
        // Show success message (you can replace with toast notification)
        alert('Product deleted successfully')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  if (state.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{state.error}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Products</h1>
          <p className="text-gray-600 mt-1">{state.total} products total</p>
        </div>
        <Link 
          href="/products/new"
          className="btn btn-primary btn-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={state.filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
          </div>
          <select
            value={state.filters.category || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, category: e.target.value, page: 1 }
            }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
          >
            <option value="">All Categories</option>
            {/* Categories will be loaded dynamically */}
          </select>
          <select
            value={`${state.filters.sortBy}_${state.filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_')
              setState(prev => ({
                ...prev,
                filters: { ...prev.filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
              }))
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
          >
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="price_asc">Price Low-High</option>
            <option value="price_desc">Price High-Low</option>
            <option value="stock_asc">Stock Low-High</option>
            <option value="stock_desc">Stock High-Low</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {state.selectedProducts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {state.selectedProducts.length} products selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="btn btn-secondary btn-sm">
                Bulk Edit
              </button>
              <button className="btn btn-destructive btn-sm">
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={state.selectedProducts.length === state.products.length && state.products.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.products.length > 0 ? (
                state.products.map((product) => (
                  <ProductRow 
                    key={product.id} 
                    product={product}
                    onSelect={handleSelectProduct}
                    onDelete={handleDeleteProduct}
                    isSelected={state.selectedProducts.includes(product.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No products found</p>
                    <Link href="/products/new" className="text-black hover:text-gray-600 font-medium">
                      Create your first product →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((state.filters.page || 1) - 1) * (state.filters.pageSize || 20) + 1} to{' '}
                {Math.min((state.filters.page || 1) * (state.filters.pageSize || 20), state.total)} of{' '}
                {state.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange((state.filters.page || 1) - 1)}
                  disabled={(state.filters.page || 1) === 1}
                  className="btn btn-secondary btn-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {state.filters.page || 1} of {state.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange((state.filters.page || 1) + 1)}
                  disabled={(state.filters.page || 1) === state.totalPages}
                  className="btn btn-secondary btn-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}