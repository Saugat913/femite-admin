import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { comparePasswords, createSession, isValidEmail, encrypt } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Find admin user by email
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND role = $2', 
      [email.toLowerCase(), 'admin']
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const user = result.rows[0]

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    // Create admin session
    await createSession(user.id, user.role)
    
    // Generate JWT token for API compatibility
    const token = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role
    })

    // Return admin user info (without password) and token
    const { password_hash, ...userInfo } = user

    return NextResponse.json({ 
      success: true,
      data: {
        user: userInfo,
        token
      },
      message: 'Admin login successful'
    })
  } catch (error) {
    console.error('POST /api/auth/login error:', error)
    return NextResponse.json({ error: 'Admin login failed' }, { status: 500 })
  }
}