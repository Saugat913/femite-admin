/**
 * In-Memory Cache System with TTL and Smart Invalidation
 * Reduces database load by caching frequently accessed data
 */

interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Tags for cache invalidation
}

class MemoryCache {
  private cache = new Map<string, CacheItem>()
  private defaultTtl = 5 * 60 * 1000 // 5 minutes default TTL

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.defaultTtl,
      tags: options.tags || []
    }
    
    this.cache.set(key, item)
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): void {
    const keysToDelete: string[] = []
    
    this.cache.forEach((item, key) => {
      if (item.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memory: JSON.stringify([...this.cache]).length
    }
  }

  /**
   * Clean expired items
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
        cleaned++
      }
    })
    
    return cleaned
  }
}

// Global cache instance
export const cache = new MemoryCache()

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,    // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 15 * 60 * 1000,    // 15 minutes
  EXTENDED: 60 * 60 * 1000 // 1 hour
} as const

// Cache tags for organized invalidation
export const CACHE_TAGS = {
  DASHBOARD: 'dashboard',
  PRODUCTS: 'products', 
  ORDERS: 'orders',
  USERS: 'users',
  CATEGORIES: 'categories',
  ANALYTICS: 'analytics',
  INVENTORY: 'inventory',
  NEWSLETTER: 'newsletter'
} as const

/**
 * Cache decorator for functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator(...args)
    
    // Try to get from cache first
    const cached = cache.get(cacheKey)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    const result = await fn(...args)
    cache.set(cacheKey, result, options)
    
    return result
  }) as T
}

/**
 * Cached query function
 */
export async function cachedQuery<T = any>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(cacheKey)
  if (cached !== null) {
    return cached
  }
  
  // Execute query and cache result
  const result = await queryFn()
  cache.set(cacheKey, result, options)
  
  return result
}

// Cleanup task - run every 10 minutes
setInterval(() => {
  const cleaned = cache.cleanup()
  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired items`)
  }
}, 10 * 60 * 1000)

export default cache