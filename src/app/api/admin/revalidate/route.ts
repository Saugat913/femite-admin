import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { cache, CACHE_TAGS } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, tag, tags, secret } = body

    // Optional: Add secret validation for external webhooks
    const revalidationSecret = process.env.REVALIDATION_SECRET
    if (revalidationSecret && secret !== revalidationSecret) {
      return NextResponse.json(
        { success: false, error: 'Invalid secret' },
        { status: 401 }
      )
    }

    console.log('🔄 ISR Revalidation requested:', { path, tag, tags })

    // Invalidate local cache first
    if (tags) {
      cache.invalidateByTags(tags)
      console.log('🗑️ Invalidated local cache for tags:', tags)
    } else if (tag) {
      cache.invalidateByTags([tag])
      console.log('🗑️ Invalidated local cache for tag:', tag)
    }

    // Perform ISR revalidation
    if (path) {
      revalidatePath(path)
      console.log('✅ Revalidated path:', path)
    }

    if (tag) {
      revalidateTag(tag)
      console.log('✅ Revalidated tag:', tag)
    }

    if (tags && Array.isArray(tags)) {
      for (const t of tags) {
        revalidateTag(t)
      }
      console.log('✅ Revalidated tags:', tags)
    }

    return NextResponse.json({
      success: true,
      message: 'Revalidation triggered successfully',
      revalidated: {
        path,
        tag,
        tags,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('ISR Revalidation error:', error)
    return NextResponse.json(
      { success: false, error: 'Revalidation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const path = url.searchParams.get('path')
    const tag = url.searchParams.get('tag')

    if (path) {
      revalidatePath(path)
      return NextResponse.json({
        success: true,
        message: `Revalidated path: ${path}`,
        timestamp: new Date().toISOString()
      })
    }

    if (tag) {
      revalidateTag(tag)
      return NextResponse.json({
        success: true,
        message: `Revalidated tag: ${tag}`,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Path or tag parameter required'
    }, { status: 400 })

  } catch (error) {
    console.error('ISR Revalidation error:', error)
    return NextResponse.json(
      { success: false, error: 'Revalidation failed' },
      { status: 500 }
    )
  }
}