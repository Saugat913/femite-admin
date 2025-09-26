'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BlogPost } from '@/types'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  User,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function BlogPostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/blog/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Blog post not found')
        }
        throw new Error('Failed to fetch blog post')
      }

      const result = await response.json()
      if (result.success) {
        setPost(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch blog post')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchPost()
    }
  }, [id])

  const handleEdit = () => {
    router.push(`/blog/${id}/edit`)
  }

  const handleDelete = async () => {
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
        router.push('/blog')
      } else {
        throw new Error(result.error || 'Failed to delete blog post')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete blog post')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (error) {
      return { relative: 'Unknown date', absolute: 'Unknown date' }
    }
  }

  const renderContent = (content: string) => {
    // Simple markdown-like rendering for display
    return content
      .split('\n\n')
      .map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0 text-gray-700 leading-relaxed">
          {paragraph
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
            .split('<')
            .map((part, i) => {
              if (i === 0) return part
              const [tag, ...rest] = part.split('>')
              const content = rest.join('>')
              
              if (tag === 'strong') return <strong key={i}>{content.replace(/<\/strong$/, '')}</strong>
              if (tag === 'em') return <em key={i}>{content.replace(/<\/em$/, '')}</em>
              if (tag.startsWith('code')) return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{content.replace(/<\/code$/, '')}</code>
              return `<${tag}>${content}`
            })}
        </p>
      ))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-2">Loading blog post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">Error loading blog post</h3>
          <p className="text-sm text-red-700 mt-1">{error || 'Blog post not found'}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={fetchPost}
              className="text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again
            </button>
            <button
              onClick={() => router.push('/blog')}
              className="text-sm font-medium text-red-800 hover:text-red-900"
            >
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    )
  }

  const publishedDate = post.is_published && post.published_at ? formatDate(post.published_at) : null
  const createdDate = formatDate(post.created_at)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/blog')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blog
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-4xl">
        {/* Meta Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {post.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {post.category}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  post.is_published
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {post.is_published ? (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Published
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Draft
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Author: {post.author_email || 'Unknown'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Created: {createdDate.relative}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {publishedDate && (
                <div className="flex items-center text-gray-600">
                  <Eye className="w-4 h-4 mr-2" />
                  <span>Published: {publishedDate.relative}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <ExternalLink className="w-4 h-4 mr-2" />
                <span className="font-mono">/{post.slug}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.image_url && (
          <div className="mb-8">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <div className="bg-gray-50 border-l-4 border-gray-300 p-4 mb-8">
            <p className="text-lg text-gray-700 italic">
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Content</h2>
          <div className="prose max-w-none">
            {renderContent(post.content)}
          </div>
        </div>

        {/* SEO Information */}
        {(post.meta_title || post.meta_description) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Settings</h2>
            <div className="space-y-4">
              {post.meta_title && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                    {post.meta_title}
                  </p>
                </div>
              )}
              {post.meta_description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                    {post.meta_description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}