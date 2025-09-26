'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BlogPostForm as BlogPostFormType } from '@/types'
import BlogPostForm from '@/components/BlogPostForm'
import { ArrowLeft } from 'lucide-react'

export default function NewBlogPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: BlogPostFormType) => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create blog post')
      }

      const result = await response.json()
      if (result.success) {
        // Redirect to the new post's view page
        router.push(`/blog/${result.data.id}`)
      } else {
        throw new Error(result.error || 'Failed to create blog post')
      }
    } catch (error) {
      console.error('Create blog post error:', error)
      alert(error instanceof Error ? error.message : 'Failed to create blog post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/blog')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/blog')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Blog
          </button>
        </div>
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Create New Blog Post</h1>
          <p className="text-gray-600 mt-1">Write and publish your new blog post</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <BlogPostForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}