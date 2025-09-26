import { NextRequest, NextResponse } from 'next/server'
import { validateSession, refreshSessionIfNeeded, isSessionNearExpiration } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSession()
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: validation.error?.message || 'Session validation failed',
        errorCode: validation.error?.code
      }, { status: 401 })
    }

    const session = validation.session!
    
    // Check if session is near expiration and refresh if needed
    const isNearExpiration = await isSessionNearExpiration()
    let sessionRefreshed = false
    
    if (isNearExpiration) {
      sessionRefreshed = await refreshSessionIfNeeded()
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      session: {
        userId: session.userId,
        role: session.role,
        issuedAt: session.issuedAt,
        expires: session.expires,
        sessionId: session.sessionId
      },
      sessionRefreshed,
      isNearExpiration
    })

  } catch (error) {
    console.error('GET /api/auth/session error:', error)
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Session check failed'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'refresh') {
      const refreshed = await refreshSessionIfNeeded()
      
      if (refreshed) {
        return NextResponse.json({
          success: true,
          message: 'Session refreshed successfully'
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Session refresh failed or not needed'
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('POST /api/auth/session error:', error)
    return NextResponse.json({
      success: false,
      error: 'Session action failed'
    }, { status: 500 })
  }
}