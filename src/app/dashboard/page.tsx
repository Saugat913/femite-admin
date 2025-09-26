'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Mail,
  Eye
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'

interface DashboardData {
  overview: {
    totalOrders: number
    paidOrders: number
    processingOrders: number
    shippedOrders: number
    totalRevenue: number
    monthlyRevenue: number
    weeklyRevenue: number
    totalCustomers: number
    monthlyNewCustomers: number
    totalProducts: number
    inStockProducts: number
    lowStockProducts: number
    outOfStockProducts: number
    totalNewsletterSubscribers: number
    monthlyNewSubscribers: number
  }
  recentOrders: Array<{
    id: string
    amount: number
    status: string
    customerEmail: string
    itemCount: number
    createdAt: string
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stock: number
    price: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
    orderCount: number
  }>
  topProducts: Array<{
    id: string
    name: string
    price: number
    totalSold: number
    totalRevenue: number
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load dashboard')
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-80"></div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-80"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${data.overview.totalRevenue.toLocaleString()}`,
      change: `$${data.overview.monthlyRevenue.toLocaleString()} this month`,
      changeType: data.overview.monthlyRevenue > 0 ? 'positive' : 'neutral',
      icon: DollarSign,
    },
    {
      name: 'Orders',
      value: data.overview.totalOrders.toLocaleString(),
      change: `${data.overview.paidOrders} paid, ${data.overview.processingOrders} processing`,
      changeType: 'neutral',
      icon: ShoppingCart,
    },
    {
      name: 'Customers',
      value: data.overview.totalCustomers.toLocaleString(),
      change: `${data.overview.monthlyNewCustomers} new this month`,
      changeType: data.overview.monthlyNewCustomers > 0 ? 'positive' : 'neutral',
      icon: Users,
    },
    {
      name: 'Products',
      value: data.overview.totalProducts.toLocaleString(),
      change: `${data.overview.lowStockProducts} low stock, ${data.overview.outOfStockProducts} out of stock`,
      changeType: data.overview.outOfStockProducts > 0 ? 'negative' : 'neutral',
      icon: Package,
    },
  ]

  const formatMonth = (dateString: string) => {
    return format(new Date(dateString), 'MMM yyyy')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50'
      case 'processing': return 'text-blue-600 bg-blue-50'
      case 'shipped': return 'text-purple-600 bg-purple-50'
      case 'delivered': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                        <dd className="text-lg font-medium text-gray-900">{item.value}</dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-500">{item.change}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip 
                  labelFormatter={formatMonth}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products by Revenue</h3>
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.totalSold} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${product.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">${parseFloat(String(product.price || 0)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customerEmail}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${order.amount.toFixed(2)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.itemCount} items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 text-center">
              <a href="/orders" className="text-sm font-medium text-green-600 hover:text-green-500">
                View all orders →
              </a>
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                Low Stock Products
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {data.lowStockProducts.length > 0 ? (
                data.lowStockProducts.map((product) => (
                  <div key={product.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${parseFloat(String(product.price || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock <= 2 ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50'
                        }`}>
                          {product.stock} left
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No low stock products
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 text-center">
              <a href="/products" className="text-sm font-medium text-green-600 hover:text-green-500">
                Manage inventory →
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter Stats */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Mail className="w-5 h-5 text-blue-500 mr-2" />
              Newsletter Subscribers
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {data.overview.totalNewsletterSubscribers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{data.overview.monthlyNewSubscribers.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">New This Month</div>
              </div>
              <div className="text-center">
                <a href="/newsletter" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500">
                  <Eye className="w-4 h-4 mr-1" />
                  Manage Subscribers
                </a>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}