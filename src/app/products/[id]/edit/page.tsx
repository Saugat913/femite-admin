'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { productsApi, categoriesApi, uploadApi } from '@/lib/api'
import type { Category, Product, CloudinaryUploadResponse } from '@/types'

interface ProductForm {
  name: string
  description: string
  price: number
  stock: number
  low_stock_threshold: number
  track_inventory: boolean
  image_url?: string
  cloudinary_public_id?: string
  image_width?: number
  image_height?: number
  category_ids: string[]
}

export default function ProductEditPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    low_stock_threshold: 10,
    track_inventory: true,
    image_url: '',
    cloudinary_public_id: '',
    image_width: undefined,
    image_height: undefined,
    category_ids: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProductAndCategories()
    }
  }, [productId])

  const fetchProductAndCategories = async () => {
    try {
      setLoading(true)
      
      const [productResponse, categoriesResponse] = await Promise.all([
        productsApi.getById(productId),
        categoriesApi.getAll()
      ])

      if (productResponse.success && productResponse.data) {
        const productData = productResponse.data as Product
        setProduct(productData)
        setForm({
          name: productData.name || '',
          description: productData.description || '',
          price: parseFloat(String(productData.price || 0)),
          stock: productData.stock || 0,
          low_stock_threshold: productData.low_stock_threshold || 10,
          track_inventory: productData.track_inventory ?? true,
          image_url: productData.image_url || '',
          cloudinary_public_id: productData.cloudinary_public_id || '',
          image_width: productData.image_width,
          image_height: productData.image_height,
          category_ids: productData.categories?.map(c => c.id) || []
        })
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data as Category[])
      }

    } catch (err) {
      console.error('Failed to load product data:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = 'Product name is required'
    } else if (form.name.length < 2) {
      newErrors.name = 'Product name must be at least 2 characters'
    }

    if (form.price <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }

    if (form.stock < 0) {
      newErrors.stock = 'Stock cannot be negative'
    }

    if (form.low_stock_threshold < 0) {
      newErrors.low_stock_threshold = 'Low stock threshold cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      
      const updateData = {
        name: form.name,
        description: form.description,
        price: Math.round(form.price * 100), // Convert to cents
        stock: form.stock,
        low_stock_threshold: form.low_stock_threshold,
        track_inventory: form.track_inventory,
        image_url: form.image_url,
        cloudinary_public_id: form.cloudinary_public_id,
        image_width: form.image_width,
        image_height: form.image_height,
        category_ids: form.category_ids
      }

      const response = await productsApi.update(productId, updateData)

      if (response.success) {
        router.push(`/products/${productId}`)
      } else {
        alert(response.error || 'Failed to update product')
      }
    } catch (err) {
      console.error('Failed to update product:', err)
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    try {
      setUploadingImage(true)
      const response = await uploadApi.image(file)

      if (response.success && response.data) {
        const uploadData = response.data as CloudinaryUploadResponse
        setForm(prev => ({
          ...prev,
          image_url: uploadData.url,
          cloudinary_public_id: uploadData.public_id,
          image_width: uploadData.width,
          image_height: uploadData.height
        }))
      } else {
        alert(response.error || 'Failed to upload image')
      }
    } catch (err) {
      console.error('Image upload error:', err)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCategoryToggle = (categoryId: string) => {
    setForm(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href={`/products/${productId}`}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-black">Edit Product</h1>
            <p className="text-gray-600 mt-1">{product?.name || 'Loading...'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="form-label">
                    Product Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input"
                    rows={4}
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="form-label">
                      Price ($) *
                    </label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className={`form-input ${errors.price ? 'border-red-300' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="stock" className="form-label">
                      Stock Quantity *
                    </label>
                    <input
                      id="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      className={`form-input ${errors.stock ? 'border-red-300' : ''}`}
                      placeholder="0"
                    />
                    {errors.stock && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="low_stock_threshold" className="form-label">
                    Low Stock Threshold
                  </label>
                  <input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                    className={`form-input ${errors.low_stock_threshold ? 'border-red-300' : ''}`}
                    placeholder="10"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Alert when stock falls below this number
                  </p>
                  {errors.low_stock_threshold && (
                    <p className="mt-1 text-sm text-red-600">{errors.low_stock_threshold}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="track_inventory"
                    type="checkbox"
                    checked={form.track_inventory}
                    onChange={(e) => setForm(prev => ({ ...prev, track_inventory: e.target.checked }))}
                    className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
                  />
                  <label htmlFor="track_inventory" className="ml-2 text-sm text-gray-700">
                    Track inventory for this product
                  </label>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Categories</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.category_ids.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-300 text-black focus:ring-black h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
              
              {categories.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No categories available</p>
                  <Link href="/categories" className="text-black hover:text-gray-600 font-medium">
                    Create categories →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Product Image</h3>
              
              <div className="space-y-4">
                {form.image_url ? (
                  <div className="relative">
                    <img 
                      src={form.image_url} 
                      alt="Product image"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No image uploaded</p>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`btn btn-secondary btn-sm w-full cursor-pointer ${uploadingImage ? 'opacity-50' : ''}`}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {form.image_url ? 'Replace Image' : 'Upload Image'}
                      </>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG or WebP. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full btn btn-primary btn-md"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
                
                <Link
                  href={`/products/${productId}`}
                  className="w-full btn btn-secondary btn-md"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}