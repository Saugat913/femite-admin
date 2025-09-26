import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Clear the admin session
    deleteSession()

    return NextResponse.json({ 
      success: true,
      message: 'Admin logout successful'
    })
  } catch (error) {
    console.error('POST /api/auth/logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}