import { NextRequest, NextResponse } from 'next/server'
import { revalidationService } from '@/lib/revalidation-service'

/**
 * Test endpoint for checking revalidation connection
 * GET /api/admin/test-revalidation
 */
export async function GET() {
  try {
    // Get configuration info
    const config = revalidationService.getConfig()
    
    // Test connection to client site
    const connectionTest = await revalidationService.testConnection()
    
    return NextResponse.json({
      success: true,
      data: {
        config: {
          clientSiteUrl: config.clientSiteUrl,
          revalidationEndpoint: config.revalidationEndpoint,
          hasSecret: config.hasSecret
        },
        connectionTest
      }
    })
  } catch (error) {
    console.error('Test revalidation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * Manual revalidation trigger for testing
 * POST /api/admin/test-revalidation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'all', id } = body
    
    let result
    
    switch (type) {
      case 'product':
        result = await revalidationService.revalidateProduct(id)
        break
      case 'blog':
        result = await revalidationService.revalidateBlog(id)
        break
      case 'all':
        result = await revalidationService.revalidateAll()
        break
      case 'paths':
        const paths = body.paths || ['/']
        result = await revalidationService.revalidatePaths(paths)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid revalidation type' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: result.success ? 'Revalidation triggered successfully' : 'Revalidation failed'
    })
  } catch (error) {
    console.error('Manual revalidation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}