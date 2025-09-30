/**
 * Serverless-optimized cache utility for Vercel deployment
 * Uses in-memory caching with TTL for better performance in serverless environment
 */

interface CacheItem<T> {
  value: T
  expiry: number
}

class ServerlessCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL: number

  constructor(defaultTTL = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { value, expiry })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Global cache instance
const serverlessCache = new ServerlessCache(
  parseInt(process.env.CACHE_DEFAULT_TTL || '300000')
)

// Clean up expired items periodically (only in serverless environment)
if (process.env.VERCEL === '1') {
  // Clean up every 5 minutes
  const cleanupInterval = 300000
  let lastCleanup = Date.now()
  
  // Use a simple timeout-based cleanup for serverless
  const scheduleCleanup = () => {
    setTimeout(() => {
      if (Date.now() - lastCleanup >= cleanupInterval) {
        serverlessCache.cleanup()
        lastCleanup = Date.now()
      }
      scheduleCleanup()
    }, cleanupInterval)
  }
  
  scheduleCleanup()
}

export { serverlessCache }
export type { CacheItem }

// Helper function for cache key generation
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

// Cache wrapper for database queries
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = serverlessCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch and cache
  try {
    const result = await fetcher()
    serverlessCache.set(key, result, ttl)
    return result
  } catch (error) {
    // Don't cache errors
    throw error
  }
}