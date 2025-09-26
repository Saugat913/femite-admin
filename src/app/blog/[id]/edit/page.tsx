'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BlogPost, BlogPostForm as BlogPostFormType } from '@/types'
import BlogPostForm from '@/components/BlogPostForm'
import { ArrowLeft } from 'lucide-react'

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    if (id) fetchPost()
  }, [id])

  const handleSubmit = async (formData: BlogPostFormType) => {
    try {
      setIsSubmitting(true)

      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update blog post')
      }

      const result = await response.json()
      if (result.success) {
        router.push(`/blog/${id}`)
      } else {
        throw new Error(result.error || 'Failed to update blog post')
      }
    } catch (error) {
      console.error('Update blog post error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update blog post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/blog/${id}`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800">Error loading blog post</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={() => router.push('/blog')}
            className="mt-3 text-sm font-medium text-red-800 hover:text-red-900"
          >
            Back to Blog
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/blog/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Post
          </button>
        </div>
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Edit Blog Post</h1>
          <p className="text-gray-600 mt-1">Update your blog post content and settings</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        {post && (
          <BlogPostForm
            initialData={post}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
