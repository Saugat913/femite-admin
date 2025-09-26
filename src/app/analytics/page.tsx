'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { analyticsApi } from '@/lib/api'
import type { DashboardStats, SalesData, AnalyticsFilter } from '@/types'

interface AnalyticsState {
  stats: DashboardStats | null
  salesData: SalesData[]
  loading: boolean
  error: string | null
  filters: AnalyticsFilter
}

const COLORS = ['#000000', '#666666', '#999999', '#cccccc']

export default function AnalyticsPage() {
  const [state, setState] = useState<AnalyticsState>({
    stats: null,
    salesData: [],
    loading: true,
    error: null,
    filters: {
      startDate: '',
      endDate: '',
      category: ''
    }
  })

  const fetchAnalyticsData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Convert filters to string record for API call
      const filterParams: Record<string, string> = {}
      if (state.filters.startDate) filterParams.startDate = state.filters.startDate
      if (state.filters.endDate) filterParams.endDate = state.filters.endDate
      if (state.filters.category) filterParams.category = state.filters.category
      
      const [dashboardResponse, salesResponse] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getSales(filterParams)
      ])
      
      if (dashboardResponse.success) {
        setState(prev => ({ ...prev, stats: dashboardResponse.data as DashboardStats }))
      }
      
      if (salesResponse.success) {
        setState(prev => ({ ...prev, salesData: salesResponse.data as SalesData[] }))
      }
      
      setState(prev => ({ ...prev, loading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load analytics data',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [state.filters])

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, startDate, endDate }
    }))
  }

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-80"></div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 h-80"></div>
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
            <BarChart3 className="w-5 h-5 text-red-600 mr-2" />
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
          <h1 className="text-3xl font-bold text-black">Analytics</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-secondary btn-md">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={state.filters.startDate || ''}
              onChange={(e) => handleDateRangeChange(e.target.value, state.filters.endDate || '')}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={state.filters.endDate || ''}
              onChange={(e) => handleDateRangeChange(state.filters.startDate || '', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            />
          </div>
          <select
            value={state.filters.category || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, category: e.target.value }
            }))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
          >
            <option value="">All Categories</option>
            {/* Categories would be loaded dynamically */}
          </select>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setState(prev => ({
                ...prev,
                filters: { startDate: '', endDate: '', category: '' }
              }))}
              className="text-gray-600 hover:text-black text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-black">
                {state.stats ? formatCurrency(state.stats.totalRevenue || 0) : '$0'}
              </p>
              {/* Trend data would come from real analytics */}
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-black">
                {(state.stats?.totalOrders || 0).toLocaleString()}
              </p>
              {/* Trend data would come from real analytics */}
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Order Value</p>
              <p className="text-2xl font-bold text-black">
                ${(() => {
                  const totalOrders = state.stats?.totalOrders || 0
                  const totalRevenue = state.stats?.totalRevenue || 0
                  return totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'
                })()}
              </p>
              {/* Trend data would come from real analytics */}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-black">
                {(state.stats?.totalCustomers || 0).toLocaleString()}
              </p>
              {/* Trend data would come from real analytics */}
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Sales Trend</h3>
            <select className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-black focus:border-black">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={state.salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666666"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                stroke="#666666"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']}
                labelStyle={{ color: '#000' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#000000" 
                strokeWidth={2}
                dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#000000', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Top Products</h3>
          <div className="space-y-4">
            {state.stats?.topProducts?.map((product, index) => (
              <div key={product.product.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{product.product.name}</p>
                    <p className="text-sm text-gray-500">{product.totalSold} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-black">
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${parseFloat(String(product.product.price || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-8">No product data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {state.stats ? [
              { status: 'Paid', count: state.stats.pendingOrders || 0, color: 'bg-green-500' },
              { status: 'Processing', count: 0, color: 'bg-blue-500' },
              { status: 'Pending', count: state.stats.pendingOrders || 0, color: 'bg-yellow-500' },
              { status: 'Shipped', count: 0, color: 'bg-purple-500' },
            ].map(item => {
              const totalOrders = state.stats?.totalOrders || 0
              const percentage = totalOrders > 0 
                ? Math.round((item.count / totalOrders) * 100) 
                : 0
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                    <span className="text-sm text-gray-600">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium text-black">
                    {item.count} ({percentage}%)
                  </span>
                </div>
              )
            }) : (
              <p className="text-gray-500 text-center py-4">No order data available</p>
            )}
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={state.salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#666666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666666"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [value, 'Orders']}
                labelStyle={{ color: '#000' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Bar 
                dataKey="orders" 
                fill="#000000"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-black mb-2">
              {state.stats?.totalProducts || 0}
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Products</div>
            <div className="text-xs text-gray-500">
              {state.stats?.lowStockProducts || 0} low stock
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-black mb-2">
              {state.stats?.pendingOrders || 0}
            </div>
            <div className="text-sm text-gray-600 mb-1">Pending Orders</div>
            <div className="text-xs text-gray-500">
              Require attention
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-black mb-2">
              {state.salesData.reduce((sum, item) => sum + item.orders, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Orders (Period)</div>
            <div className="text-xs text-gray-500">
              Selected date range
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}