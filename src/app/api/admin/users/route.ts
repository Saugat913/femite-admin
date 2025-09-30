import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    
    console.log('Users API params:', { page, limit, search, role, url: request.url })

    const offset = (page - 1) * limit

    // Build the query based on filters
    let whereClause = ''
    let queryParams = []

    if (search || role) {
      const conditions = []
      let paramIndex = 1

      if (search) {
        conditions.push(`email ILIKE $${paramIndex}`)
        queryParams.push(`%${search}%`)
        paramIndex++
      }

      if (role) {
        conditions.push(`role = $${paramIndex}`)
        queryParams.push(role)
        paramIndex++
      }

      whereClause = `WHERE ${conditions.join(' AND ')}`
    }

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult?.rows[0]?.count || '0')

    // Get users with pagination
    const usersResult = await query(
      `SELECT 
        id, 
        email, 
        role, 
        email_verified, 
        created_at, 
        last_login_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    )

    // Get additional statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'client') as customers,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users
      FROM users
    `)

    const stats = statsResult?.rows[0] || {
      admins: 0,
      customers: 0,
      new_this_month: 0,
      verified_users: 0
    }

    const responseData = {
      data: usersResult?.rows || [],
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
        perPage: limit
      },
      stats: {
        totalAdmins: parseInt(stats.admins),
        totalCustomers: parseInt(stats.customers),
        newThisMonth: parseInt(stats.new_this_month),
        verifiedUsers: parseInt(stats.verified_users)
      }
    }
    
    console.log('Users API response:', { total, page, limit, rowsReturned: usersResult?.rows.length || 0 })
    
    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role = 'client' } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'client'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be admin or client' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser?.rows && existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await query(`
      INSERT INTO users (id, email, password_hash, role, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      RETURNING id, email, role, created_at, email_verified
    `, [email, hashedPassword, role])

    return NextResponse.json({
      success: true,
      data: result?.rows[0]
    })

  } catch (error) {
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}