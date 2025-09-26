'use client'

import { useState, useEffect } from 'react'
import { 
  Tags, 
  Plus,
  Search, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  Package
} from 'lucide-react'
import { categoriesApi } from '@/lib/api'
import type { Category, CategoryForm } from '@/types'

interface CategoriesPageState {
  categories: Category[]
  loading: boolean
  error: string | null
  showModal: boolean
  editingCategory: Category | null
  form: CategoryForm
}

function CategoryRow({ category, onEdit, onDelete }: {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
            <Tags className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-black">{category.name}</p>
            <p className="text-sm text-gray-500 max-w-xs truncate">
              {category.description || 'No description'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center">
          <Package className="w-4 h-4 text-gray-400 mr-1" />
          {category.product_count || 0} products
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(category.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(category)}
            className="text-black hover:text-gray-600"
            title="Edit category"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-red-600 hover:text-red-800"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function CategoryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  category, 
  loading 
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (form: CategoryForm) => void
  category: Category | null
  loading: boolean
}) {
  const [form, setForm] = useState<CategoryForm>({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        description: category.description || ''
      })
    } else {
      setForm({ name: '', description: '' })
    }
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-black mb-4">
          {category ? 'Edit Category' : 'Add New Category'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Category Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              placeholder="e.g., T-Shirts, Hoodies, Accessories"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="form-label">Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="form-input"
              rows={3}
              placeholder="Brief description of this category"
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary btn-md flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {category ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {category ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary btn-md flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  category, 
  loading 
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  category: Category | null
  loading: boolean
}) {
  if (!isOpen || !category) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
          <h3 className="text-lg font-semibold text-black">Delete Category</h3>
        </div>

        <p className="text-gray-600 mb-4">
          Are you sure you want to delete the category "{category.name}"?
          {category.product_count && category.product_count > 0 && (
            <span className="text-red-600 block mt-2">
              Warning: This category has {category.product_count} product(s) assigned to it.
            </span>
          )}
        </p>

        <div className="flex items-center space-x-2">
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-destructive btn-md flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Category'
            )}
          </button>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-md flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [state, setState] = useState<CategoriesPageState>({
    categories: [],
    loading: true,
    error: null,
    showModal: false,
    editingCategory: null,
    form: { name: '', description: '' }
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCategories = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await categoriesApi.getAll()
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          categories: (response.data as Category[]) || [],
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load categories',
          loading: false
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load categories',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (form: CategoryForm) => {
    try {
      setActionLoading(true)
      
      let response
      if (state.editingCategory) {
        response = await categoriesApi.update(state.editingCategory.id, form as unknown as Record<string, unknown>)
      } else {
        response = await categoriesApi.create(form as unknown as Record<string, unknown>)
      }
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          showModal: false,
          editingCategory: null,
          form: { name: '', description: '' }
        }))
        await fetchCategories()
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to save category'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save category'
      }))
    } finally {
      setActionLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setState(prev => ({
      ...prev,
      editingCategory: category,
      showModal: true,
      error: null
    }))
  }

  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCategory) return
    
    try {
      setActionLoading(true)
      
      const response = await categoriesApi.delete(deletingCategory.id)
      
      if (response.success) {
        setShowDeleteModal(false)
        setDeletingCategory(null)
        await fetchCategories()
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to delete category'
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete category'
      }))
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddNew = () => {
    setState(prev => ({
      ...prev,
      editingCategory: null,
      showModal: true,
      error: null
    }))
  }

  const filteredCategories = state.categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Categories</h1>
          <p className="text-gray-600 mt-1">{state.categories.length} categories total</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="btn btn-primary btn-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{state.error}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-black focus:border-black"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <CategoryRow 
                    key={category.id} 
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <Tags className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    {searchTerm ? (
                      <div>
                        <p>No categories found matching "{searchTerm}"</p>
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="text-black hover:text-gray-600 font-medium"
                        >
                          Clear search →
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p>No categories created yet</p>
                        <button 
                          onClick={handleAddNew}
                          className="text-black hover:text-gray-600 font-medium"
                        >
                          Create your first category →
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={state.showModal}
        onClose={() => setState(prev => ({ 
          ...prev, 
          showModal: false, 
          editingCategory: null,
          error: null
        }))}
        onSubmit={handleSubmit}
        category={state.editingCategory}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingCategory(null)
          setState(prev => ({ ...prev, error: null }))
        }}
        onConfirm={confirmDelete}
        category={deletingCategory}
        loading={actionLoading}
      />
    </div>
  )
}