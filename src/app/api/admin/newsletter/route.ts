import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // 'active', 'inactive'

    const offset = (page - 1) * pageSize

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND email ILIKE $${paramIndex}`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      const isActive = status === 'active'
      whereClause += ` AND active = $${paramIndex}`
      params.push(isActive)
      paramIndex++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM newsletter_subscriptions ${whereClause}`
    const countResult = await query(countQuery, params)
    const total = parseInt(countResult?.rows[0]?.count || '0')

    // Get subscriptions with pagination
    const subscriptionsQuery = `
      SELECT 
        id, 
        email, 
        active, 
        subscribed_at,
        unsubscribed_at,
        source
      FROM newsletter_subscriptions 
      ${whereClause}
      ORDER BY subscribed_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(pageSize, offset)
    const result = await query(subscriptionsQuery, params)

    const totalPages = Math.ceil(total / pageSize)

    // Get stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week
      FROM newsletter_subscriptions
    `)

    const stats = statsResult?.rows[0] || {
      total_subscribers: 0,
      active_subscribers: 0,
      new_this_month: 0,
      new_this_week: 0
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: result?.rows || [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        },
        stats: {
          totalSubscribers: parseInt(stats.total_subscribers),
          activeSubscribers: parseInt(stats.active_subscribers),
          newThisMonth: parseInt(stats.new_this_month),
          newThisWeek: parseInt(stats.new_this_week)
        }
      }
    })

  } catch (error) {
    console.error('GET /api/admin/newsletter error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch newsletter subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, active = true, source = 'admin' } = body

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingResult = await query(
      'SELECT id, active FROM newsletter_subscriptions WHERE email = $1',
      [email]
    )

    if (existingResult && existingResult.rows.length > 0) {
      const existing = existingResult.rows[0]
      if (existing.active) {
        return NextResponse.json(
          { success: false, error: 'Email is already subscribed' },
          { status: 400 }
        )
      } else {
        // Reactivate existing subscription
        const result = await query(
          `UPDATE newsletter_subscriptions 
           SET active = $1, subscribed_at = NOW(), unsubscribed_at = NULL, source = $2
           WHERE email = $3
           RETURNING *`,
          [active, source, email]
        )
        return NextResponse.json({
          success: true,
          data: result?.rows[0],
          message: 'Subscription reactivated successfully'
        })
      }
    }

    // Create new subscription
    const result = await query(
      `INSERT INTO newsletter_subscriptions (id, email, active, subscribed_at, source)
       VALUES (gen_random_uuid(), $1, $2, NOW(), $3)
       RETURNING *`,
      [email, active, source]
    )

    return NextResponse.json({
      success: true,
      data: result?.rows[0],
      message: 'Subscription created successfully'
    })

  } catch (error) {
    console.error('POST /api/admin/newsletter error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create newsletter subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { emails = [] } = body

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email array is required' },
        { status: 400 }
      )
    }

    // Delete or unsubscribe multiple emails
    const placeholders = emails.map((_, index) => `$${index + 1}`).join(', ')
    
    const result = await query(
      `UPDATE newsletter_subscriptions 
       SET active = false, unsubscribed_at = NOW()
       WHERE email IN (${placeholders})`,
      emails
    )

    return NextResponse.json({
      success: true,
      message: `${result?.rowCount || 0} subscriptions unsubscribed successfully`
    })

  } catch (error) {
    console.error('DELETE /api/admin/newsletter error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unsubscribe emails' },
      { status: 500 }
    )
  }
}