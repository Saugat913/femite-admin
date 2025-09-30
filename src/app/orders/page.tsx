'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { ordersApi } from '@/lib/api'
import type { Order, PaginatedResponse, SearchFilters, OrderStatus } from '@/types'
import { formatCurrencyFromCents } from '@/lib/utils/format'

interface OrdersPageState {
  orders: Order[]
  loading: boolean
  error: string | null
  filters: SearchFilters
  total: number
  totalPages: number
  selectedOrders: string[]
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'cart':
        return { text: 'Cart', color: 'bg-gray-100 text-gray-800', icon: ShoppingCart }
      case 'pending_payment':
        return { text: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'payment_processing':
        return { text: 'Processing Payment', color: 'bg-blue-100 text-blue-800', icon: Clock }
      case 'paid':
        return { text: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'processing':
        return { text: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package }
      case 'shipped':
        return { text: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck }
      case 'delivered':
        return { text: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'cancelled':
        return { text: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
      case 'refunded':
        return { text: 'Refunded', color: 'bg-red-100 text-red-800', icon: XCircle }
      default:
        return { text: status, color: 'bg-gray-100 text-gray-800', icon: ShoppingCart }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </span>
  )
}

function OrderRow({ order, onSelect, isSelected }: {
  order: Order
  onSelect: (id: string) => void
  isSelected: boolean
}) {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(order.id)}
          className="rounded border-gray-300 text-black focus:ring-black"
        />
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-black">#{order.id.slice(0, 8)}</p>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-black">{order.user?.email || 'N/A'}</p>
          <p className="text-sm text-gray-500">
            {order.items?.length || 0} items
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-black">
        {formatCurrencyFromCents(order.total)}
      </td>
      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {order.tracking_number || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {order.updated_at 
          ? new Date(order.updated_at).toLocaleDateString()
          : new Date(order.created_at).toLocaleDateString()
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Link 
            href={`/orders/${order.id}`}
            className="text-black hover:text-gray-600"
            title="View order details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link 
            href={`/orders/${order.id}/edit`}
            className="text-black hover:text-gray-600"
            title="Edit order"
          >
            <Edit className="w-4 h-4" />
          </Link>
          {order.status === 'paid' && (
            <button 
              className="text-blue-600 hover:text-blue-800"
              title="Ship order"
            >
              <Truck className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function OrdersPage() {
  const [state, setState] = useState<OrdersPageState>({
    orders: [],
    loading: true,
    error: null,
    filters: {
      search: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    total: 0,
    totalPages: 0,
    selectedOrders: []
  })

  const fetchOrders = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Convert filters to string record for API params
      const filterParams: Record<string, string> = {}
      if (state.filters.search) filterParams.search = state.filters.search
      if (state.filters.status) filterParams.status = state.filters.status
      if (state.filters.dateFrom) filterParams.dateFrom = state.filters.dateFrom
      if (state.filters.dateTo) filterParams.dateTo = state.filters.dateTo
      if (state.filters.sortBy) filterParams.sortBy = state.filters.sortBy
      if (state.filters.sortOrder) filterParams.sortOrder = state.filters.sortOrder
      if (typeof state.filters.page === 'number') filterParams.page = String(state.filters.page)
      if (typeof state.filters.pageSize === 'number') filterParams.pageSize = String(state.filters.pageSize)
      
      const response = await ordersApi.getAll(filterParams)
      
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<Order>
        setState(prev => ({
          ...prev,
          orders: data.data || [],
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load orders',
          loading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load orders',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [state.filters])

  const handleSearch = (search: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search, page: 1 }
    }))
  }

  const handleSelectOrder = (orderId: string) => {
    setState(prev => ({
      ...prev,
      selectedOrders: prev.selectedOrders.includes(orderId)
        ? prev.selectedOrders.filter(id => id !== orderId)
        : [...prev.selectedOrders, orderId]
    }))
  }

  const handleSelectAll = () => {
    setState(prev => ({
      ...prev,
      selectedOrders: prev.selectedOrders.length === prev.orders.length 
        ? [] 
        : prev.orders.map(o => o.id)
    }))
  }

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, page }
    }))
  }

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (state.selectedOrders.length === 0) return
    
    try {
      // Implement bulk status update
      console.log('Bulk updating orders to status:', status, state.selectedOrders)
      // Refresh data after update
      await fetchOrders()
      setState(prev => ({ ...prev, selectedOrders: [] }))
    } catch (error) {
      console.error('Bulk update error:', error)
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

  const statusOptions: { value: OrderStatus | '', label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'pending_payment', label: 'Pending Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Orders</h1>
          <p className="text-gray-600 mt-1">{state.total} orders total</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-secondary btn-md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={state.filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
          </div>
          <select
            value={state.filters.status || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, status: e.target.value, page: 1 }
            }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={state.filters.dateFrom || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, dateFrom: e.target.value, page: 1 }
            }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            placeholder="From date"
          />
          <input
            type="date"
            value={state.filters.dateTo || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, dateTo: e.target.value, page: 1 }
            }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            placeholder="To date"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {state.selectedOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {state.selectedOrders.length} orders selected
            </span>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value as OrderStatus)
                  }
                }}
                className="border border-blue-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bulk Actions</option>
                <option value="processing">Mark as Processing</option>
                <option value="shipped">Mark as Shipped</option>
                <option value="delivered">Mark as Delivered</option>
                <option value="cancelled">Mark as Cancelled</option>
              </select>
              <button className="btn btn-secondary btn-sm">
                Export Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={state.selectedOrders.length === state.orders.length && state.orders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.orders.length > 0 ? (
                state.orders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order}
                    onSelect={handleSelectOrder}
                    isSelected={state.selectedOrders.includes(order.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No orders found</p>
                    {state.filters.search || state.filters.status ? (
                      <button 
                        onClick={() => setState(prev => ({
                          ...prev,
                          filters: { ...prev.filters, search: '', status: '', page: 1 }
                        }))}
                        className="text-black hover:text-gray-600 font-medium"
                      >
                        Clear filters →
                      </button>
                    ) : (
                      <p className="text-gray-400 mt-2">Orders will appear here when customers place them</p>
                    )}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-600">
                {state.orders.filter(o => o.status === 'pending_payment').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600">
                {state.orders.filter(o => ['paid', 'processing'].includes(o.status)).length}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shipped</p>
              <p className="text-2xl font-bold text-purple-600">
                {state.orders.filter(o => o.status === 'shipped').length}
              </p>
            </div>
            <Truck className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {state.orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>
    </div>
  )
}