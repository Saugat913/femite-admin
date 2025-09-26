/**
 * API service for admin panel
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : '/api'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      }

      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      }
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // Upload files
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }
}

// Export singleton instance
export const api = new ApiService()

// Specific API methods for admin operations

// Products
export const productsApi = {
  getAll: (params?: Record<string, string>) => api.get(`/admin/products${params ? `?${new URLSearchParams(params)}` : ''}`),
  getById: (id: string) => api.get(`/admin/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/admin/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
  updateStock: (id: string, stock: number) => api.patch(`/admin/products/${id}/stock`, { stock }),
}

// Categories
export const categoriesApi = {
  getAll: () => api.get('/admin/categories'),
  getById: (id: string) => api.get(`/admin/categories/${id}`),
  create: (data: Record<string, unknown>) => api.post('/admin/categories', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/admin/categories/${id}`, data),
  delete: (id: string) => api.delete(`/admin/categories/${id}`),
}

// Orders
export const ordersApi = {
  getAll: (params?: Record<string, string>) => api.get(`/admin/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
  getById: (id: string) => api.get(`/admin/orders/${id}`),
  updateStatus: (id: string, status: string, notes?: string) => 
    api.patch(`/admin/orders/${id}/status`, { status, notes }),
  updateTracking: (id: string, trackingNumber: string) => 
    api.patch(`/admin/orders/${id}/tracking`, { trackingNumber }),
  cancel: (id: string, reason?: string) => api.patch(`/admin/orders/${id}/cancel`, { reason }),
  refund: (id: string, amount?: number) => api.post(`/admin/orders/${id}/refund`, { amount }),
}

// Users/Customers
export const usersApi = {
  getAll: (params?: Record<string, string>) => api.get(`/admin/users${params ? `?${new URLSearchParams(params)}` : ''}`),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
  getOrders: (id: string) => api.get(`/admin/users/${id}/orders`),
}

// Analytics
export const analyticsApi = {
  getDashboard: () => api.get('/admin/analytics/dashboard'),
  getSales: (params?: Record<string, string>) => api.get(`/admin/analytics/sales${params ? `?${new URLSearchParams(params)}` : ''}`),
  getProducts: (params?: Record<string, string>) => api.get(`/admin/analytics/products${params ? `?${new URLSearchParams(params)}` : ''}`),
  getCustomers: () => api.get('/admin/analytics/customers'),
  getInventory: () => api.get('/admin/analytics/inventory'),
}

// Inventory
export const inventoryApi = {
  getAll: () => api.get('/admin/inventory'),
  getLowStock: () => api.get('/admin/inventory/low-stock'),
  getMovements: (productId?: string) => api.get(`/admin/inventory/movements${productId ? `?productId=${productId}` : ''}`),
  adjustStock: (productId: string, quantity: number, reason: string) => 
    api.post('/admin/inventory/adjust', { productId, quantity, reason }),
}

// Settings
export const settingsApi = {
  get: () => api.get('/admin/settings'),
  update: (data: Record<string, unknown>) => api.put('/admin/settings', data),
  getShipping: () => api.get('/admin/settings/shipping'),
  updateShipping: (data: Record<string, unknown>) => api.put('/admin/settings/shipping', data),
  getPayment: () => api.get('/admin/settings/payment'),
  updatePayment: (data: Record<string, unknown>) => api.put('/admin/settings/payment', data),
}

// File uploads
export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.upload('/admin/upload/image', formData)
  },
  images: (files: FileList) => {
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('images', file))
    return api.upload('/admin/upload/images', formData)
  },
}

export default api