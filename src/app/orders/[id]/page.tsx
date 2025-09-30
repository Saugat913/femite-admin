'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  User,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { ordersApi } from '@/lib/api'
import type { Order, OrderStatus } from '@/types'
import { formatCurrencyFromCents } from '@/lib/utils/format'

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

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

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
        setOrder(response.data as Order)
      } else {
        setError(response.error || 'Failed to load order')
      }
    } catch (err) {
      setError('Failed to load order data')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStatusUpdate = async (status: OrderStatus) => {
    if (!order) return

    try {
      setUpdating(true)
      const response = await ordersApi.updateStatus(order.id, status)

      if (response.success) {
        await fetchOrderData() // Refresh data
      } else {
        alert(response.error || 'Failed to update order status')
      }
    } catch (err) {
      alert('Failed to update order status')
    } finally {
      setUpdating(false)
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/orders"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-gray-600 mt-1">
              Created on {new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <OrderStatusBadge status={order.status} />
          <Link 
            href={`/orders/${order.id}/edit`}
            className="btn btn-secondary btn-md"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      {item.product?.image_url ? (
                        <img 
                          src={item.product.image_url} 
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-black">{item.product?.name || 'Product'}</h3>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-500">Unit Price: {formatCurrencyFromCents(item.price)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">
                        {formatCurrencyFromCents(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No items in this order</p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-black">{formatCurrencyFromCents(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-black">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-black">$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-100">
                  <span className="text-black">Total:</span>
                  <span className="text-black">{formatCurrencyFromCents(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-black mb-4">Order Timeline</h2>
            
            <div className="space-y-4">
              {order.status_history && order.status_history.length > 0 ? (
                order.status_history.map((history, index) => (
                  <div key={history.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-black rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-black">
                          Status changed to {history.status.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(history.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {history.notes && (
                        <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No status history available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              {order.status === 'paid' && (
                <button
                  onClick={() => handleQuickStatusUpdate('processing')}
                  disabled={updating}
                  className="w-full btn btn-secondary btn-sm"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Mark as Processing
                </button>
              )}
              
              {order.status === 'processing' && (
                <button
                  onClick={() => handleQuickStatusUpdate('shipped')}
                  disabled={updating}
                  className="w-full btn btn-secondary btn-sm"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Mark as Shipped
                </button>
              )}
              
              {order.status === 'shipped' && (
                <button
                  onClick={() => handleQuickStatusUpdate('delivered')}
                  disabled={updating}
                  className="w-full btn btn-secondary btn-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </button>
              )}
              
              {['paid', 'processing'].includes(order.status) && (
                <button
                  onClick={() => handleQuickStatusUpdate('cancelled')}
                  disabled={updating}
                  className="w-full btn btn-destructive btn-sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Customer Details
            </h3>
            
            {order.user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{order.user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Customer ID: {order.user.id.slice(0, 8)}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No customer information available</p>
            )}
          </div>

          {/* Shipping Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Shipping Address
            </h3>
            
            {(() => {
              const addresses = order.user?.addresses || []
              const shipping = addresses.find(a => a.type === 'shipping' && a.is_default) || addresses[0]
              if (!shipping) return <p className="text-sm text-gray-500">No address on file</p>
              return (
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {`${shipping.first_name} ${shipping.last_name}${shipping.company ? ' - ' + shipping.company : ''}\n${shipping.address_line1}${shipping.address_line2 ? ', ' + shipping.address_line2 : ''}\n${shipping.city}, ${shipping.state} ${shipping.postal_code}\n${shipping.country}${shipping.phone ? '\n' + shipping.phone : ''}`}
                </div>
              )
            })()}

            {order.tracking_number && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-black">Tracking Number</p>
                    <p className="text-sm text-gray-600">{order.tracking_number}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Details
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className="text-black capitalize">{order.status.replace('_', ' ')}</span>
              </div>
              
              {order.stripe_payment_intent_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="text-black font-mono text-xs">
                    {order.stripe_payment_intent_id.slice(0, 16)}...
                  </span>
                </div>
              )}
              
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-100">
                <span className="text-black">Total Paid:</span>
                <span className="text-black">${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}