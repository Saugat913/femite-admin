'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  Mail,
  AlertTriangle,
  UserCheck,
  UserX,
  ShoppingCart,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import { usersApi } from '@/lib/api'
import type { User, PaginatedResponse, SearchFilters } from '@/types'

interface UsersPageState {
  users: User[]
  loading: boolean
  error: string | null
  filters: SearchFilters
  total: number
  totalPages: number
  selectedUsers: string[]
}

function UserRow({ user, onSelect, isSelected }: {
  user: User
  onSelect: (id: string) => void
  isSelected: boolean
}) {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(user.id)}
          className="rounded border-gray-300 text-black focus:ring-black"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-black">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {user.role}
              </span>
              {user.email_verified && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {user.addresses?.length || 0} addresses
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Link 
            href={`/users/${user.id}`}
            className="text-black hover:text-gray-600"
            title="View user details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link 
            href={`/users/${user.id}/orders`}
            className="text-blue-600 hover:text-blue-800"
            title="View orders"
          >
            <ShoppingCart className="w-4 h-4" />
          </Link>
          <Link 
            href={`/users/${user.id}/edit`}
            className="text-black hover:text-gray-600"
            title="Edit user"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button 
            className="text-red-600 hover:text-red-800"
            title="Send email"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function UsersPage() {
  const [state, setState] = useState<UsersPageState>({
    users: [],
    loading: true,
    error: null,
    filters: {
      search: '',
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc'
    },
    total: 0,
    totalPages: 0,
    selectedUsers: []
  })

  const fetchUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      // Convert filters to string record
      const filtersAsStrings = Object.fromEntries(
        Object.entries(state.filters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, String(value)])
      )
      
      const response = await usersApi.getAll(filtersAsStrings)
      
      if (response.success && response.data) {
        const data = response.data as PaginatedResponse<User>
        setState(prev => ({
          ...prev,
          users: data.data || [],
          total: data.total || 0,
          totalPages: data.totalPages || 0,
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load users',
          loading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load users',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [state.filters])

  const handleSearch = (search: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, search, page: 1 }
    }))
  }

  const handleSelectUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }))
  }

  const handleSelectAll = () => {
    setState(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.length === prev.users.length 
        ? [] 
        : prev.users.map(u => u.id)
    }))
  }

  const handlePageChange = (page: number) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, page }
    }))
  }

  const handleRoleFilter = (role: string) => {
    setState(prev => ({
      ...prev,
      filters: { 
        ...prev.filters, 
        search: role === '' ? '' : `role:${role}`, 
        page: 1 
      }
    }))
  }

  const handleBulkAction = async (action: string) => {
    if (state.selectedUsers.length === 0) return
    
    try {
      console.log('Bulk action:', action, state.selectedUsers)
      // Implement bulk actions here
      await fetchUsers()
      setState(prev => ({ ...prev, selectedUsers: [] }))
    } catch (error) {
      console.error('Bulk action error:', error)
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

  const totalCustomers = state.users.filter(u => u.role === 'client').length
  const totalAdmins = state.users.filter(u => u.role === 'admin').length
  const verifiedUsers = state.users.filter(u => u.email_verified).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Users</h1>
          <p className="text-gray-600 mt-1">{state.total} users total</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-black">{state.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-green-600">{totalCustomers}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{totalAdmins}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-blue-600">{verifiedUsers}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users by email..."
                value={state.filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
          </div>
          <select
            onChange={(e) => handleRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
          >
            <option value="">All Roles</option>
            <option value="client">Customers</option>
            <option value="admin">Admins</option>
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
            <option value="email_asc">Email A-Z</option>
            <option value="email_desc">Email Z-A</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {state.selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {state.selectedUsers.length} users selected
            </span>
            <div className="flex items-center space-x-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction(e.target.value)
                  }
                }}
                className="border border-blue-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bulk Actions</option>
                <option value="verify">Verify Email</option>
                <option value="deactivate">Deactivate</option>
                <option value="export">Export</option>
                <option value="email">Send Email</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={state.selectedUsers.length === state.users.length && state.users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Addresses
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.users.length > 0 ? (
                state.users.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user}
                    onSelect={handleSelectUser}
                    isSelected={state.selectedUsers.includes(user.id)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No users found</p>
                    {state.filters.search ? (
                      <button 
                        onClick={() => handleSearch('')}
                        className="text-black hover:text-gray-600 font-medium"
                      >
                        Clear search →
                      </button>
                    ) : (
                      <p className="text-gray-400 mt-2">Users will appear here when they register</p>
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
    </div>
  )
}