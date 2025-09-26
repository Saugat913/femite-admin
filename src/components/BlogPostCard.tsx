'use client'

import { BlogPost } from '@/types'
import { Calendar, User, Eye, Edit, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BlogPostCardProps {
  post: BlogPost
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onView: (id: string) => void
}

export default function BlogPostCard({ post, onEdit, onDelete, onView }: BlogPostCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Unknown date'
    }
  }

  const truncateText = (text: string, length: number) => {
    if (text.length <= length) return text
    return text.slice(0, length) + '...'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Featured Image */}
      {post.image_url && (
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Category & Status */}
            <div className="flex items-center space-x-2 mb-2">
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
                {post.is_published ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {truncateText(post.excerpt, 120)}
              </p>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            <span>{post.author_email || 'Unknown Author'}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {post.is_published && post.published_at
                ? `Published ${formatDate(post.published_at)}`
                : `Created ${formatDate(post.created_at)}`}
            </span>
          </div>
        </div>

        {/* Slug Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center text-sm text-gray-600">
            <ExternalLink className="w-4 h-4 mr-2" />
            <span className="font-mono">/{post.slug}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(post.id)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </button>
            <button
              onClick={() => onEdit(post.id)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
          
          <button
            onClick={() => onDelete(post.id)}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}