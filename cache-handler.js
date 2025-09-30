const { CacheHandler } = require('@neshca/cache-handler')
const createLruHandler = require('@neshca/cache-handler/local-lru').default
const createRedisHandler = require('@neshca/cache-handler/redis-strings').default

class CustomCacheHandler extends CacheHandler {
  constructor(options) {
    super(options)
    
    console.log('🚀 Custom Cache Handler initialized for ISR')
    
    // Use LRU cache for development, Redis for production
    if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
      console.log('Using Redis cache handler')
      this.handler = createRedisHandler({
        url: process.env.REDIS_URL,
        keyPrefix: 'hempadmin:',
        timeoutMs: 5000,
        // Configure Redis for ISR
        retryDelayOnClusterDown: 300,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      })
    } else {
      console.log('Using LRU cache handler')
      this.handler = createLruHandler({
        maxItemsNumber: 1000, // Store up to 1000 pages
        maxItemSizeBytes: 1024 * 1024 * 10, // 10MB per item
      })
    }
  }

  async get(key) {
    try {
      const result = await this.handler.get(key)
      if (result) {
        console.log(`📦 Cache HIT for key: ${key}`)
      } else {
        console.log(`💸 Cache MISS for key: ${key}`)
      }
      return result
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key, data, ctx) {
    try {
      // Add metadata for debugging
      const enrichedData = {
        ...data,
        cached_at: new Date().toISOString(),
        cache_tags: ctx.tags || [],
        revalidate: ctx.revalidate
      }
      
      await this.handler.set(key, enrichedData, ctx)
      console.log(`💾 Cached key: ${key}, revalidate: ${ctx.revalidate || 'never'}, tags: ${ctx.tags || 'none'}`)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  async revalidateTag(tag) {
    try {
      console.log(`🔄 Revalidating tag: ${tag}`)
      await this.handler.revalidateTag(tag)
      return true
    } catch (error) {
      console.error('Cache revalidateTag error:', error)
      return false
    }
  }
}

module.exports = CustomCacheHandler