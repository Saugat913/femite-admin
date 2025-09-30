import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const result = await query(`
      SELECT 
        id, 
        email, 
        role, 
        email_verified,
        created_at, 
        last_login_at
      FROM users 
      WHERE id = $1
    `, [userId])

    if (!result || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get additional user statistics
    const statsResult = await query(`
      SELECT 
        COUNT(o.id) as total_orders,
        COALESCE(SUM(COALESCE(o.total_amount, o.total)), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND COALESCE(o.status_v2, o.status) IN ('paid', 'processing', 'shipped', 'delivered')
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId])

    const stats = statsResult?.rows[0] || {
      total_orders: 0,
      total_spent: 0
    }

    const userData = {
      ...result?.rows[0],
      stats: {
        totalOrders: parseInt(stats.total_orders),
        totalSpent: parseFloat(stats.total_spent) / 100 // Convert cents to dollars
      }
    }

    return NextResponse.json({
      success: true,
      data: userData
    })

  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const body = await request.json()
    const { email, role, password } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !['admin', 'client'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be admin or client' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    )

    if (!existingUser || existingUser.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    )

    if (emailCheck?.rows && emailCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email is already taken by another user' },
        { status: 400 }
      )
    }

    // Build update query based on provided fields
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    updateFields.push(`email = $${paramIndex}`)
    updateValues.push(email)
    paramIndex++

    if (role) {
      updateFields.push(`role = $${paramIndex}`)
      updateValues.push(role)
      paramIndex++
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updateFields.push(`password_hash = $${paramIndex}`)
      updateValues.push(hashedPassword)
      paramIndex++
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(userId) // For WHERE clause

    const result = await query(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, role, email_verified, created_at, last_login_at
    `, updateValues)

    return NextResponse.json({
      success: true,
      data: result?.rows[0]
    })

  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    )

    if (!existingUser || existingUser.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has any orders (optional protection)
    const ordersResult = await query(
      'SELECT COUNT(*) as order_count FROM orders WHERE user_id = $1',
      [userId]
    )

    const orderCount = parseInt(ordersResult?.rows[0]?.order_count || '0')

    if (orderCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete user with existing orders' },
        { status: 400 }
      )
    }

    // Delete the user
    await query('DELETE FROM users WHERE id = $1', [userId])

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}