'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  History,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { productsApi, inventoryApi } from '@/lib/api'
import type { Product, InventoryLog } from '@/types'

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProductData()
    }
  }, [productId])

  const fetchProductData = async () => {
    try {
      setLoading(true)
      
      const [productResponse, inventoryResponse] = await Promise.all([
        productsApi.getById(productId),
        inventoryApi.getMovements(productId)
      ])

      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data as Product)
      } else {
        setError(productResponse.error || 'Failed to load product')
      }

      if (inventoryResponse.success && inventoryResponse.data) {
        setInventoryLogs((inventoryResponse.data as InventoryLog[]) || [])
      }

    } catch (err) {
      setError('Failed to load product data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(true)
      const response = await productsApi.delete(product.id)
      
      if (response.success) {
        router.push('/products')
      } else {
        alert(response.error || 'Failed to delete product')
      }
    } catch (err) {
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const getStockStatus = () => {
    if (!product) return null
    
    if (product.stock === 0) {
      return { text: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle }
    }
    if (product.stock <= product.low_stock_threshold) {
      return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: AlertTriangle }
    }
    return { text: 'In Stock', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-64"></div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-48"></div>
            </div>
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-32"></div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 h-48"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error || 'Product not found'}</span>
          </div>
        </div>
      </div>
    )
  }

  const stockStatus = getStockStatus()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/products"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">{product.name}</h1>
            <p className="text-gray-600 mt-1">Product Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href={`/products/${product.id}/edit`}
            className="btn btn-secondary btn-md"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Link>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-destructive btn-md"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {product.image_url && (
                  <div className="mb-4">
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Product Name</label>
                    <p className="text-base text-black">{product.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-base text-gray-600">{product.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <p className="text-2xl font-bold text-black">${parseFloat(String(product.price || 0)).toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Stock Status</label>
                  {stockStatus && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${stockStatus.color}`}>
                      <stockStatus.icon className="w-4 h-4 mr-2" />
                      {stockStatus.text} ({product.stock} available)
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Low Stock Threshold</label>
                  <p className="text-base text-gray-600">{product.low_stock_threshold} units</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map(category => (
                        <span 
                          key={category.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          {category.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No categories assigned</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-base text-gray-600">
                    {new Date(product.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory History */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4 flex items-center">
              <History className="w-5 h-5 mr-2" />
              Inventory History
            </h2>
            
            <div className="space-y-3">
              {inventoryLogs.length > 0 ? (
                inventoryLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-black">
                        {log.change_type === 'stock_in' ? '+' : '-'}{Math.abs(log.quantity_change)} units
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.notes || log.change_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Stock: {log.previous_stock} → {log.new_stock}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No inventory movements yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Quick Stats</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-700">Price</span>
                </div>
                <span className="font-semibold text-black">${parseFloat(String(product.price || 0)).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Stock</span>
                </div>
                <span className="font-semibold text-black">{product.stock}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-700">Threshold</span>
                </div>
                <span className="font-semibold text-black">{product.low_stock_threshold}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Link 
                href={`/products/${product.id}/edit`}
                className="w-full btn btn-secondary btn-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Link>
              
              <Link 
                href={`/inventory?product=${product.id}`}
                className="w-full btn btn-secondary btn-sm"
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Inventory
              </Link>
              
              <Link 
                href={`/orders?product=${product.id}`}
                className="w-full btn btn-secondary btn-sm"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}