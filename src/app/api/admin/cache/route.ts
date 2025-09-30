import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const stats = cache.getStats()
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('GET /api/admin/cache error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const tags = url.searchParams.get('tags')?.split(',')
    const key = url.searchParams.get('key')
    
    if (key) {
      const deleted = cache.delete(key)
      return NextResponse.json({
        success: true,
        message: deleted ? `Deleted cache key: ${key}` : `Key not found: ${key}`
      })
    }
    
    if (tags && tags.length > 0) {
      cache.invalidateByTags(tags)
      return NextResponse.json({
        success: true,
        message: `Invalidated cache for tags: ${tags.join(', ')}`
      })
    }
    
    // Clear all cache
    cache.clear()
    return NextResponse.json({
      success: true,
      message: 'All cache cleared'
    })
    
  } catch (error) {
    console.error('DELETE /api/admin/cache error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}