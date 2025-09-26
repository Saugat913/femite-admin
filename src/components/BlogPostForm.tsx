'use client'

import { useState, useEffect } from 'react'
import { BlogPost, BlogPostForm as BlogPostFormType } from '@/types'
import { useAuth } from '@/lib/auth-context'
import { Upload, Save, X, Eye, EyeOff } from 'lucide-react'

interface BlogPostFormProps {
  initialData?: BlogPost
  onSubmit: (data: BlogPostFormType) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function BlogPostForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: BlogPostFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<BlogPostFormType>({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: '',
    slug: '',
    author_id: user?.userId || '',
    is_published: false,
    published_at: '',
    meta_title: '',
    meta_description: ''
  })
  
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        excerpt: initialData.excerpt || '',
        content: initialData.content,
        image_url: initialData.image_url || '',
        category: initialData.category || '',
        slug: initialData.slug,
        author_id: initialData.author_id,
        is_published: initialData.is_published,
        published_at: initialData.published_at || '',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || ''
      })
    }
  }, [initialData])

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !initialData) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title, initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'blog')

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      if (result.success) {
        setFormData(prev => ({ ...prev, image_url: result.data.url }))
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content) {
      alert('Title and content are required')
      return
    }

    await onSubmit(formData)
  }

  const renderMarkdownPreview = (content: string) => {
    // Simple markdown preview (you might want to use a proper markdown parser)
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              placeholder="Enter blog post title"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              URL Slug
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              placeholder="url-friendly-slug"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
              Excerpt
            </label>
            <textarea
              name="excerpt"
              id="excerpt"
              rows={3}
              value={formData.excerpt}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              placeholder="Brief description of the blog post"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              name="category"
              id="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              placeholder="Hemp fashion, Sustainability, etc."
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Featured Image
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                {imageUploading ? 'Uploading...' : 'Upload Image'}
              </label>
              
              {formData.image_url && (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {formData.image_url && (
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                placeholder="Or paste image URL"
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Content</h3>
          <button
            type="button"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {isPreviewMode ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>
        </div>

        {isPreviewMode ? (
          <div 
            className="prose max-w-none min-h-96 p-4 border border-gray-300 rounded-md bg-gray-50"
            dangerouslySetInnerHTML={{ 
              __html: `<p>${renderMarkdownPreview(formData.content)}</p>` 
            }}
          />
        ) : (
          <textarea
            name="content"
            id="content"
            rows={20}
            required
            value={formData.content}
            onChange={handleInputChange}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
            placeholder="Write your blog post content here... (Supports basic markdown)"
          />
        )}
      </div>

      {/* SEO Settings */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700">
              Meta Title
            </label>
            <input
              type="text"
              name="meta_title"
              id="meta_title"
              value={formData.meta_title}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              placeholder="SEO title for search engines"
            />
          </div>

          <div>
            <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700">
              Meta Description
            </label>
            <textarea
              name="meta_description"
              id="meta_description"
              rows={3}
              value={formData.meta_description}
              onChange={handleInputChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              placeholder="SEO description for search engines (recommended: 150-160 characters)"
            />
          </div>
        </div>
      </div>

      {/* Publishing */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Publishing</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="is_published"
              name="is_published"
              type="checkbox"
              checked={formData.is_published}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
              Publish immediately
            </label>
          </div>

          {formData.is_published && (
            <div>
              <label htmlFor="published_at" className="block text-sm font-medium text-gray-700">
                Publish Date & Time
              </label>
              <input
                type="datetime-local"
                name="published_at"
                id="published_at"
                value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : initialData ? 'Update Post' : 'Create Post'}
        </button>
      </div>
    </form>
  )
}