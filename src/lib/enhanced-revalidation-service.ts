/**
 * Enhanced Revalidation Service for Hemp Admin Panel
 * 
 * This enhanced service handles triggering cache revalidation on the client-side e-commerce site
 * with configurable timing, retry logic, and image cache busting capabilities.
 */

export interface RevalidationOptions {
  type?: 'product' | 'blog' | 'all'
  id?: string
  path?: string
  paths?: string[]
  imageUpdate?: boolean // Flag for image updates requiring special cache busting
  timestamp?: string // For cache busting
}

export interface RevalidationResponse {
  success: boolean
  revalidated?: boolean
  timestamp?: string
  paths?: string[]
  tags?: string[]
  type?: string
  id?: string
  error?: string
  message?: string
  imagesCacheBusted?: boolean
}

class EnhancedRevalidationService {
  private clientSiteUrl: string
  private revalidationSecret: string
  private timeout: number
  private retryAttempts: number
  private retryDelay: number

  constructor() {
    this.clientSiteUrl = process.env.CLIENT_SITE_URL || process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'
    this.revalidationSecret = process.env.CLIENT_SITE_REVALIDATION_SECRET || ''
    
    // Configurable timing options
    this.timeout = parseInt(process.env.REVALIDATION_TIMEOUT || '15000') // 15 seconds default
    this.retryAttempts = parseInt(process.env.REVALIDATION_RETRY_ATTEMPTS || '3') // 3 attempts default
    this.retryDelay = parseInt(process.env.REVALIDATION_RETRY_DELAY || '2000') // 2 seconds default
    
    if (!this.revalidationSecret) {
      console.warn('⚠️ CLIENT_SITE_REVALIDATION_SECRET not configured - revalidation requests will fail')
    }
  }

  /**
   * Trigger revalidation on the client site with enhanced options
   */
  async triggerRevalidation(options: RevalidationOptions): Promise<RevalidationResponse> {
    if (!this.revalidationSecret) {
      console.error('❌ Revalidation secret not configured')
      return {
        success: false,
        error: 'Revalidation secret not configured'
      }
    }

    const url = `${this.clientSiteUrl}/api/revalidate`
    
    // Add timestamp for cache busting
    const timestamp = new Date().toISOString()
    
    const payload = {
      secret: this.revalidationSecret,
      timestamp,
      ...options
    }

    console.log(`🔄 Triggering enhanced revalidation: ${JSON.stringify({ ...payload, secret: '[REDACTED]' })}`)

    return this.executeWithRetry(url, payload)
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(url: string, payload: any, attempt: number = 1): Promise<RevalidationResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Retry on server errors (5xx) or timeout
        if (response.status >= 500 && attempt < this.retryAttempts) {
          console.warn(`⚠️ Revalidation attempt ${attempt} failed (${response.status}), retrying in ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay)
          return this.executeWithRetry(url, payload, attempt + 1)
        }
        
        console.error(`❌ Revalidation failed with status ${response.status}:`, errorData)
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log(`✅ Enhanced revalidation successful (attempt ${attempt}):`, result.paths || 'unknown paths')
      
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Retry on network errors
      if (attempt < this.retryAttempts && (error instanceof TypeError || errorMessage.includes('fetch'))) {
        console.warn(`⚠️ Revalidation attempt ${attempt} failed (${errorMessage}), retrying in ${this.retryDelay}ms...`)
        await this.delay(this.retryDelay)
        return this.executeWithRetry(url, payload, attempt + 1)
      }
      
      console.error(`❌ Revalidation request failed after ${attempt} attempts:`, errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Trigger revalidation for product-related pages with image cache busting
   */
  async revalidateProduct(productId?: string, imageUpdated: boolean = false): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      type: 'product',
      id: productId,
      imageUpdate: imageUpdated,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Trigger revalidation for blog-related pages
   */
  async revalidateBlog(blogSlug?: string, imageUpdated: boolean = false): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      type: 'blog',
      id: blogSlug,
      imageUpdate: imageUpdated,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Trigger revalidation for all main pages
   */
  async revalidateAll(): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      type: 'all',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Trigger revalidation for specific paths with cache busting
   */
  async revalidatePaths(paths: string[], imageUpdated: boolean = false): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      paths,
      imageUpdate: imageUpdated,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Get client site configuration info
   */
  getConfig() {
    return {
      clientSiteUrl: this.clientSiteUrl,
      hasSecret: !!this.revalidationSecret,
      revalidationEndpoint: `${this.clientSiteUrl}/api/revalidate`,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    }
  }

  /**
   * Test the revalidation connection
   */
  async testConnection(): Promise<{
    success: boolean
    endpoint: string
    message: string
    error?: string
    responseTime?: number
  }> {
    const endpoint = `${this.clientSiteUrl}/api/revalidate`
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for test

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          endpoint,
          message: data.message || 'Endpoint is reachable',
          responseTime
        }
      } else {
        return {
          success: false,
          endpoint,
          message: `Endpoint returned ${response.status}`,
          error: response.statusText,
          responseTime
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        success: false,
        endpoint,
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    }
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const enhancedRevalidationService = new EnhancedRevalidationService()

// Utility functions for common revalidation scenarios
export const revalidateAfterProductChange = (productId?: string, imageUpdated: boolean = false) => {
  // Don't await - run in background
  enhancedRevalidationService.revalidateProduct(productId, imageUpdated).catch(error => {
    console.error('Background product revalidation failed:', error)
  })
}

export const revalidateAfterBlogChange = (blogSlug?: string, imageUpdated: boolean = false) => {
  // Don't await - run in background
  enhancedRevalidationService.revalidateBlog(blogSlug, imageUpdated).catch(error => {
    console.error('Background blog revalidation failed:', error)
  })
}

export const revalidateAfterBulkChange = () => {
  // Don't await - run in background
  enhancedRevalidationService.revalidateAll().catch(error => {
    console.error('Background bulk revalidation failed:', error)
  })
}