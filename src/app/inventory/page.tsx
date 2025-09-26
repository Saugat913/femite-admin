'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle,
  Plus,
  Minus,
  Search,
  Eye,
  History,
  Edit,
  TrendingDown,
  TrendingUp,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { inventoryApi, productsApi } from '@/lib/api'
import type { Product, InventoryLog, InventoryAdjustment } from '@/types'

interface InventoryPageState {
  products: Product[]
  lowStockProducts: Product[]
  inventoryMovements: InventoryLog[]
  loading: boolean
  error: string | null
  selectedProduct: Product | null
  showAdjustmentModal: boolean
  adjustmentForm: InventoryAdjustment
}

function ProductStockRow({ product, onAdjustStock }: {
  product: Product
  onAdjustStock: (product: Product) => void
}) {
  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    if (stock <= threshold) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', icon: Package }
  }

  const stockStatus = getStockStatus(product.stock, product.low_stock_threshold)
  const StatusIcon = stockStatus.icon

  return (
    <tr className="hover:bg-gray-50">
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
            <p className="text-sm text-gray-500">ID: {product.id.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          <span className="text-lg font-bold text-black mr-2">{product.stock}</span>
          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {stockStatus.text}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {product.low_stock_threshold}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          product.track_inventory ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {product.track_inventory ? 'Tracked' : 'Not Tracked'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(product.updated_at || product.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Link 
            href={`/products/${product.id}`}
            className="text-black hover:text-gray-600"
            title="View product"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => onAdjustStock(product)}
            className="text-blue-600 hover:text-blue-800"
            title="Adjust stock"
          >
            <Edit className="w-4 h-4" />
          </button>
          <Link 
            href={`/inventory/movements/${product.id}`}
            className="text-gray-600 hover:text-gray-800"
            title="View movements"
          >
            <History className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  )
}

function MovementRow({ movement }: { movement: InventoryLog }) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'stock_in': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'stock_out': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'sold': return <Package className="w-4 h-4 text-blue-600" />
      case 'reserved': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'unreserved': return <AlertTriangle className="w-4 h-4 text-gray-600" />
      default: return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'stock_in': return 'text-green-600'
      case 'stock_out': return 'text-red-600'
      case 'sold': return 'text-blue-600'
      case 'reserved': return 'text-yellow-600'
      case 'unreserved': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center">
          {getMovementIcon(movement.change_type)}
          <span className={`ml-2 text-sm font-medium ${getMovementColor(movement.change_type)}`}>
            {movement.change_type.replace('_', ' ')}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-black">
        {movement.product?.name || 'Unknown Product'}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-medium ${
          movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {movement.previous_stock} → {movement.new_stock}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {movement.notes || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(movement.created_at).toLocaleString()}
      </td>
    </tr>
  )
}

function StockAdjustmentModal({ 
  product, 
  isOpen, 
  onClose, 
  onSubmit 
}: {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (adjustment: InventoryAdjustment) => void
}) {
  const [form, setForm] = useState<InventoryAdjustment>({
    product_id: '',
    quantity: 0,
    reason: '',
    notes: ''
  })

  useEffect(() => {
    if (product) {
      setForm(prev => ({ ...prev, product_id: product.id }))
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
    setForm({ product_id: '', quantity: 0, reason: '', notes: '' })
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-black mb-4">
          Adjust Stock for {product.name}
        </h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Current Stock: <span className="font-medium text-black">{product.stock}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Quantity Change</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              className="form-input"
              placeholder="Enter positive or negative number"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              New stock will be: {product.stock + form.quantity}
            </p>
          </div>

          <div>
            <label className="form-label">Reason</label>
            <select
              value={form.reason}
              onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
              className="form-input"
              required
            >
              <option value="">Select reason...</option>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
              <option value="correction">Inventory Correction</option>
              <option value="return">Customer Return</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes (Optional)</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="form-input"
              rows={3}
              placeholder="Additional notes about this adjustment"
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <button type="submit" className="btn btn-primary btn-md flex-1">
              Adjust Stock
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary btn-md flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [state, setState] = useState<InventoryPageState>({
    products: [],
    lowStockProducts: [],
    inventoryMovements: [],
    loading: true,
    error: null,
    selectedProduct: null,
    showAdjustmentModal: false,
    adjustmentForm: {
      product_id: '',
      quantity: 0,
      reason: '',
      notes: ''
    }
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('stock')

  const fetchInventoryData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const [productsResponse, lowStockResponse, movementsResponse] = await Promise.all([
        productsApi.getAll({ pageSize: '100' }),
        inventoryApi.getLowStock(),
        inventoryApi.getMovements()
      ])
      
      setState(prev => ({
        ...prev,
        products: productsResponse.success ? (productsResponse.data as any)?.data || [] : [],
        lowStockProducts: lowStockResponse.success ? (lowStockResponse.data as Product[]) : [],
        inventoryMovements: movementsResponse.success ? (movementsResponse.data as InventoryLog[]) : [],
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load inventory data',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const handleAdjustStock = (product: Product) => {
    setState(prev => ({
      ...prev,
      selectedProduct: product,
      showAdjustmentModal: true
    }))
  }

  const handleSubmitAdjustment = async (adjustment: InventoryAdjustment) => {
    try {
      const response = await inventoryApi.adjustStock(
        adjustment.product_id, 
        adjustment.quantity, 
        adjustment.reason
      )
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          showAdjustmentModal: false,
          selectedProduct: null 
        }))
        await fetchInventoryData()
      } else {
        setState(prev => ({ ...prev, error: response.error || 'Failed to adjust stock' }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to adjust stock'
      }))
    }
  }

  const filteredProducts = state.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'low' && product.stock <= product.low_stock_threshold) ||
      (filterStatus === 'out' && product.stock === 0) ||
      (filterStatus === 'in' && product.stock > product.low_stock_threshold)
    
    return matchesSearch && matchesFilter
  })

  if (state.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 h-32"></div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 h-80"></div>
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

  const outOfStockCount = state.products.filter(p => p.stock === 0).length
  const lowStockCount = state.products.filter(p => p.stock > 0 && p.stock <= p.low_stock_threshold).length
  const totalValue = state.products.reduce((sum, p) => sum + (p.stock * parseFloat(String(p.price || 0))), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage stock levels and track inventory movements</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-black">{state.products.length}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-black">${(totalValue / 100).toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stock'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recent Movements
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'stock' && (
        <>
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
              >
                <option value="all">All Products</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Low Stock Alert
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <ProductStockRow 
                        key={product.id} 
                        product={product}
                        onAdjustStock={handleAdjustStock}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p>No products found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'movements' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black">Recent Inventory Movements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Movement Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Change
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.inventoryMovements.length > 0 ? (
                  state.inventoryMovements.map((movement) => (
                    <MovementRow key={movement.id} movement={movement} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <History className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p>No inventory movements found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        product={state.selectedProduct}
        isOpen={state.showAdjustmentModal}
        onClose={() => setState(prev => ({ 
          ...prev, 
          showAdjustmentModal: false, 
          selectedProduct: null 
        }))}
        onSubmit={handleSubmitAdjustment}
      />
    </div>
  )
}