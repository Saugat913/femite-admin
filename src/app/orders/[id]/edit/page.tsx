'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Truck, 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { ordersApi } from '@/lib/api'
import type { Order, OrderStatus, OrderUpdateForm } from '@/types'

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'cart':
        return { text: 'Cart', color: 'bg-gray-100 text-gray-800', icon: Package }
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
        return { text: status, color: 'bg-gray-100 text-gray-800', icon: Package }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
      <Icon className="w-4 h-4 mr-2" />
      {config.text}
    </span>
  )
}

export default function OrderEditPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [form, setForm] = useState<OrderUpdateForm>({
    status: 'pending_payment',
    tracking_number: '',
    notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (orderId) {
      fetchOrderData()
    }
  }, [orderId])

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      const response = await ordersApi.getById(orderId)

      if (response.success && response.data) {
        const orderData = response.data as Order
        setOrder(orderData)
        setForm({
          status: orderData.status,
          tracking_number: orderData.tracking_number || '',
          notes: ''
        })
      } else {
        setError(response.error || 'Failed to load order')
      }
    } catch (err) {
      setError('Failed to load order data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!order) return

    try {
      setSaving(true)
      
      // First update the status if it changed
      if (form.status !== order.status) {
        const statusResponse = await ordersApi.updateStatus(
          order.id, 
          form.status,
          form.notes
        )
        
        if (!statusResponse.success) {
          throw new Error(statusResponse.error || 'Failed to update order status')
        }
      }
      
      // Then update tracking number if provided and different
      if (form.tracking_number && form.tracking_number !== order.tracking_number) {
        const trackingResponse = await ordersApi.updateTracking(
          order.id,
          form.tracking_number
        )
        
        if (!trackingResponse.success) {
          throw new Error(trackingResponse.error || 'Failed to update tracking number')
        }
      }
      
      // Navigate back to order details
      router.push(`/orders/${order.id}`)
      
    } catch (err) {
      console.error('Failed to update order:', err)
      setError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-20 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error || 'Order not found'}</span>
          </div>
        </div>
      </div>
    )
  }

  const statusOptions: { value: OrderStatus, label: string }[] = [
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
        <div className="flex items-center space-x-4">
          <Link 
            href={`/orders/${order.id}`}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">Edit Order</h1>
            <p className="text-gray-600 mt-1">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Order Status</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                  className="form-input"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="form-label">Status Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  rows={3}
                  placeholder="Add notes about this status change (e.g., reason for cancellation)"
                />
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Shipping Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tracking_number" className="form-label">Tracking Number</label>
                <input
                  id="tracking_number"
                  type="text"
                  value={form.tracking_number}
                  onChange={(e) => setForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                  className="form-input"
                  placeholder="Enter tracking number"
                />
              </div>

              {/* Render user's default shipping address if available */}
              {(() => {
                const addresses = order.user?.addresses || []
                const shipping = addresses.find(a => a.type === 'shipping' && a.is_default) || addresses[0]
                return shipping ? (
                  <div>
                    <label className="form-label">Shipping Address</label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600 whitespace-pre-line">
                      {`${shipping.first_name} ${shipping.last_name}${shipping.company ? ' - ' + shipping.company : ''}\n${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}\n${shipping.city}, ${shipping.state} ${shipping.postal_code}\n${shipping.country}${shipping.phone ? '\n' + shipping.phone : ''}`}
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Order Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{order.user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Items</p>
              <p className="font-medium">{order.items?.length || 0} items</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="font-medium">${(order.total / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <Link
            href={`/orders/${order.id}`}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}