'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Users, 
  UserPlus,
  TrendingUp,
  Calendar,
  CheckCircle,
  Settings,
  Zap,
  ShoppingBag,
  Bell,
  Activity,
  Clock,
  AlertCircle,
  Search,
  Trash2,
  Plus,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { NewsletterSubscription } from '@/types'

interface NewsletterStats {
  totalSubscribers: number
  activeSubscribers: number
  newThisMonth: number
  newThisWeek: number
}

export default function NewsletterPage() {
  const [data, setData] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchNewsletterStats()
  }, [currentPage, searchTerm, statusFilter])

  const fetchNewsletterStats = async () => {
    try {
      setLoading(true)
      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
      const statusQuery = statusFilter !== 'all' ? `&status=${statusFilter}` : ''
      const response = await fetch(`/api/admin/newsletter?page=${currentPage}&pageSize=${pageSize}${searchQuery}${statusQuery}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch newsletter data')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
        // Mock recent activity for now - in a real system this would come from logs
        setRecentActivity([
          {
            id: 1,
            type: 'product_announcement',
            message: 'New product "Hemp Classic Tee" announced to 247 subscribers',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            success: true,
            count: 247
          },
          {
            id: 2,
            type: 'subscription',
            message: '3 new newsletter subscriptions',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            success: true,
            count: 3
          },
          {
            id: 3,
            type: 'product_announcement',
            message: 'New product "Hemp Eco Shirt" announced to 245 subscribers',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            success: true,
            count: 245
          },
          {
            id: 4,
            type: 'subscription',
            message: '1 new newsletter subscription',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            success: true,
            count: 1
          }
        ])
      } else {
        setError(result.error || 'Failed to load newsletter data')
      }
    } catch (err) {
      console.error('Newsletter stats fetch error:', err)
      setError('Failed to load newsletter data')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'product_announcement': return <ShoppingBag className="w-4 h-4 text-green-600" />
      case 'subscription': return <UserPlus className="w-4 h-4 text-blue-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const handleBulkUnsubscribe = async () => {
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: selectedEmails }),
        credentials: 'include',
      })
      
      const result = await response.json()
      if (result.success) {
        setSelectedEmails([])
        fetchNewsletterStats() // Refresh data
      } else {
        setError(result.error || 'Failed to unsubscribe emails')
      }
    } catch (err) {
      setError('Failed to unsubscribe emails')
    }
  }

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, source: 'admin' }),
        credentials: 'include',
      })
      
      const result = await response.json()
      if (result.success) {
        setNewEmail('')
        setShowAddForm(false)
        fetchNewsletterStats() // Refresh data
      } else {
        setError(result.error || 'Failed to add subscription')
      }
    } catch (err) {
      setError('Failed to add subscription')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.subscriptions) {
      setSelectedEmails(data.subscriptions.map((sub: any) => sub.email))
    } else {
      setSelectedEmails([])
    }
  }

  const handleSelectEmail = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, email])
    } else {
      setSelectedEmails(prev => prev.filter(e => e !== email))
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-32"></div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm h-96"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const displayStats = [
    {
      name: 'Total Subscribers',
      value: data.stats.totalSubscribers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Active Subscribers',
      value: data.stats.activeSubscribers.toLocaleString(),
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'New This Month',
      value: data.stats.newThisMonth.toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'New This Week',
      value: data.stats.newThisWeek.toLocaleString(),
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.name} className={`bg-white overflow-hidden shadow rounded-lg border border-gray-200`}>
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${item.bgColor} rounded-md p-3`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd className="text-2xl font-bold text-gray-900">{item.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscribers..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            {selectedEmails.length > 0 && (
              <button
                onClick={handleBulkUnsubscribe}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Unsubscribe ({selectedEmails.length})
              </button>
            )}
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subscriber
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubscription} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <input
                type="email"
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewEmail('')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Subscribers Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={data.subscriptions?.length > 0 && selectedEmails.length === data.subscriptions?.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="focus:ring-black focus:ring-2"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unsubscribed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.subscriptions?.map((subscription: NewsletterSubscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(subscription.email)}
                      onChange={(e) => handleSelectEmail(subscription.email, e.target.checked)}
                      className="focus:ring-black focus:ring-2"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {subscription.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subscription.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subscription.active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(subscription.subscribed_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subscription.unsubscribed_at 
                      ? format(new Date(subscription.unsubscribed_at), 'MMM d, yyyy')
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, data.pagination.total)} of {data.pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {data.pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
                disabled={currentPage === data.pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}