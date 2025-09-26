/**
 * Revalidation Service for Hemp Admin Panel
 * 
 * This service handles triggering cache revalidation on the client-side e-commerce site
 * whenever products or blog posts are created, updated, or deleted in the admin panel.
 */

export interface RevalidationOptions {
  type?: 'product' | 'blog' | 'all'
  id?: string
  path?: string
  paths?: string[]
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
}

class RevalidationService {
  private clientSiteUrl: string
  private revalidationSecret: string

  constructor() {
    this.clientSiteUrl = process.env.CLIENT_SITE_URL || process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000'
    this.revalidationSecret = process.env.CLIENT_SITE_REVALIDATION_SECRET || ''
    
    if (!this.revalidationSecret) {
      console.warn('⚠️ CLIENT_SITE_REVALIDATION_SECRET not configured - revalidation requests will fail')
    }
  }

  /**
   * Trigger revalidation on the client site
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
    
    const payload = {
      secret: this.revalidationSecret,
      ...options
    }

    console.log(`🔄 Triggering revalidation: ${JSON.stringify({ ...payload, secret: '[REDACTED]' })}`)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`❌ Revalidation failed with status ${response.status}:`, errorData)
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log(`✅ Revalidation successful:`, result.paths || 'unknown paths')
      
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Revalidation request failed:', errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Trigger revalidation for product-related pages
   */
  async revalidateProduct(productId?: string): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      type: 'product',
      id: productId
    })
  }

  /**
   * Trigger revalidation for blog-related pages
   */
  async revalidateBlog(blogSlug?: string): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      type: 'blog',
      id: blogSlug
    })
  }

  /**
   * Trigger revalidation for all main pages
   */
  async revalidateAll(): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      type: 'all'
    })
  }

  /**
   * Trigger revalidation for specific paths
   */
  async revalidatePaths(paths: string[]): Promise<RevalidationResponse> {
    return this.triggerRevalidation({
      paths
    })
  }

  /**
   * Get client site configuration info
   */
  getConfig() {
    return {
      clientSiteUrl: this.clientSiteUrl,
      hasSecret: !!this.revalidationSecret,
      revalidationEndpoint: `${this.clientSiteUrl}/api/revalidate`
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
  }> {
    const endpoint = `${this.clientSiteUrl}/api/revalidate`
    
    try {
      // Test GET request to check if endpoint is available
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          endpoint,
          message: data.message || 'Endpoint is reachable'
        }
      } else {
        return {
          success: false,
          endpoint,
          message: `Endpoint returned ${response.status}`,
          error: response.statusText
        }
      }
    } catch (error) {
      return {
        success: false,
        endpoint,
        message: 'Connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const revalidationService = new RevalidationService()

// Utility functions for common revalidation scenarios
export const revalidateAfterProductChange = (productId?: string) => {
  // Don't await - run in background
  revalidationService.revalidateProduct(productId).catch(error => {
    console.error('Background product revalidation failed:', error)
  })
}

export const revalidateAfterBlogChange = (blogSlug?: string) => {
  // Don't await - run in background
  revalidationService.revalidateBlog(blogSlug).catch(error => {
    console.error('Background blog revalidation failed:', error)
  })
}

export const revalidateAfterBulkChange = () => {
  // Don't await - run in background
  revalidationService.revalidateAll().catch(error => {
    console.error('Background bulk revalidation failed:', error)
  })
}