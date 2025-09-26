'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPost } from '@/types'
import BlogPostCard from '@/components/BlogPostCard'
import BlogStats from '@/components/BlogStats'
import { 
  Plus, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface BlogData {
  posts: BlogPost[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  stats: {
    totalPosts: number
    publishedPosts: number
    draftPosts: number
    newThisMonth: number
    totalCategories: number
  }
  categories: Array<{ category: string; post_count: number }>
}

export default function BlogPage() {
  const router = useRouter()
  const [blogData, setBlogData] = useState<BlogData>({
    posts: [],
    pagination: { page: 1, pageSize: 12, total: 0, totalPages: 0 },
    stats: { totalPosts: 0, publishedPosts: 0, draftPosts: 0, newThisMonth: 0, totalCategories: 0 },
    categories: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchBlogPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '12',
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/blog?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts')
      }

      const result = await response.json()
      if (result.success) {
        setBlogData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch blog posts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogPosts()
  }, [currentPage, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBlogPosts()
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1)
    switch (filterType) {
      case 'category':
        setSelectedCategory(value)
        break
      case 'status':
        setSelectedStatus(value)
        break
      case 'sortBy':
        setSortBy(value)
        break
    }
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const handleCreatePost = () => {
    router.push('/blog/new')
  }

  const handleViewPost = (id: string) => {
    router.push(`/blog/${id}`)
  }

  const handleEditPost = (id: string) => {
    router.push(`/blog/${id}/edit`)
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete blog post')
      }

      const result = await response.json()
      if (result.success) {
        // Refresh the list
        fetchBlogPosts()
      } else {
        throw new Error(result.error || 'Failed to delete blog post')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete blog post')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPagination = () => {
    const { page, totalPages } = blogData.pagination
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{(page - 1) * blogData.pagination.pageSize + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(page * blogData.pagination.pageSize, blogData.pagination.total)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{blogData.pagination.total}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pages.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    pageNum === page
                      ? 'z-10 bg-black text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-black'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">Error loading blog posts</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={fetchBlogPosts}
            className="mt-3 text-sm font-medium text-red-800 hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-gray-600 mt-1">Manage your blog posts and content</p>
          </div>
          <button
            onClick={handleCreatePost}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <BlogStats stats={blogData.stats} />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters and Sort */}
          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            >
              <option value="">All Categories</option>
              {blogData.categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.post_count})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-black focus:border-black"
            >
              <option value="created_at">Date Created</option>
              <option value="updated_at">Date Modified</option>
              <option value="published_at">Date Published</option>
              <option value="title">Title</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
            </button>

            <button
              onClick={fetchBlogPosts}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-2">Loading blog posts...</p>
        </div>
      ) : blogData.posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first blog post</p>
          <button
            onClick={handleCreatePost}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Post
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {blogData.posts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                onView={handleViewPost}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {renderPagination()}
        </>
      )}
    </div>
  )
}