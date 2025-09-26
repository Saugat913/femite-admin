/**
 * TypeScript interfaces for the hemp fashion admin panel
 */

export interface User {
  id: string
  email: string
  role: 'admin' | 'client'
  created_at: string
  email_verified?: boolean
  addresses?: UserAddress[]
}

export interface UserAddress {
  id: string
  user_id: string
  type: 'shipping' | 'billing'
  first_name: string
  last_name: string
  company?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: string | number  // Database returns NUMERIC as string
  stock: number
  image_url?: string
  cloudinary_public_id?: string
  image_width?: number
  image_height?: number
  low_stock_threshold: number
  track_inventory: boolean
  created_at: string
  updated_at?: string
  categories?: Category[]
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at?: string
  product_count?: number
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: OrderStatus
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at?: string
  payment_id?: string
  stripe_payment_intent_id?: string
  user?: User
  items?: OrderItem[]
  status_history?: OrderStatusHistory[]
}

export type OrderStatus = 
  | 'cart' 
  | 'pending_payment' 
  | 'payment_processing' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product?: Product
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus
  notes?: string
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  stripe_payment_intent_id: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_method?: string
  created_at: string
  updated_at?: string
}

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'

export interface StockReservation {
  id: string
  product_id: string
  cart_id: string
  quantity: number
  reserved_at: string
  expires_at: string
  created_at: string
}

export interface InventoryLog {
  id: string
  product_id: string
  change_type: InventoryChangeType
  quantity_change: number
  previous_stock: number
  new_stock: number
  reference_id?: string
  notes?: string
  created_at: string
  product?: Product
}

export type InventoryChangeType = 'stock_in' | 'stock_out' | 'reserved' | 'unreserved' | 'sold'

// Analytics and Dashboard Types
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  pendingOrders: number
  lowStockProducts: number
  recentOrders: Order[]
  topProducts: ProductStats[]
  salesTrend: SalesData[]
}

export interface ProductStats {
  product: Product
  totalSold: number
  revenue: number
}

export interface SalesData {
  date: string
  sales: number
  orders: number
}

export interface AnalyticsFilter {
  startDate?: string
  endDate?: string
  status?: OrderStatus
  category?: string
}

// Form Types
export interface ProductForm {
  name: string
  description?: string
  price: number
  stock: number
  image_url?: string
  low_stock_threshold: number
  track_inventory: boolean
  category_ids: string[]
}

export interface CategoryForm {
  name: string
  description?: string
}

export interface OrderUpdateForm {
  status: OrderStatus
  tracking_number?: string
  notes?: string
}

export interface UserForm {
  email: string
  role: 'admin' | 'client'
  password?: string
}

export interface InventoryAdjustment {
  product_id: string
  quantity: number
  reason: string
  notes?: string
}

// Settings Types
export interface StoreSettings {
  store_name: string
  store_email: string
  store_phone?: string
  store_address?: string
  currency: string
  tax_rate: number
  shipping_enabled: boolean
  default_shipping_cost: number
}

export interface ShippingSettings {
  enabled: boolean
  free_shipping_threshold?: number
  default_cost: number
  zones: ShippingZone[]
}

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  cost: number
  free_threshold?: number
}

export interface PaymentSettings {
  stripe_enabled: boolean
  stripe_publishable_key?: string
  paypal_enabled: boolean
  cash_on_delivery_enabled: boolean
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SearchFilters {
  search?: string
  category?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

// UI State Types
export interface LoadingState {
  [key: string]: boolean
}

export interface ErrorState {
  [key: string]: string | null
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// File Upload Types
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimetype: string
}

// Cloudinary Upload Response
export interface CloudinaryUploadResponse {
  url: string
  public_id: string
  width: number
  height: number
  secure_url: string
  format: string
  resource_type: string
  bytes: number
  created_at: string
}

// Bulk Operations
export interface BulkAction {
  action: string
  ids: string[]
  data?: any
}

export interface BulkResult {
  success: number
  failed: number
  errors: string[]
}

// Blog Types
export interface BlogPost {
  id: string
  title: string
  excerpt?: string
  content: string
  image_url?: string
  category?: string
  slug: string
  author_id: string
  author_email?: string
  published_at?: string
  is_published: boolean
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at?: string
}

export interface BlogPostForm {
  title: string
  excerpt?: string
  content: string
  image_url?: string
  category?: string
  slug?: string
  author_id: string
  is_published: boolean
  published_at?: string
  meta_title?: string
  meta_description?: string
}

// Newsletter Types
export interface NewsletterSubscription {
  id: string
  email: string
  active: boolean
  subscribed_at: string
  unsubscribed_at?: string
  source?: string
}
