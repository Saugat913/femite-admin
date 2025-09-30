import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * pageSize

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (o.id::text ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (dateFrom) {
      whereClause += ` AND o.created_at >= $${paramIndex}::date`
      params.push(dateFrom)
      paramIndex++
    }

    if (dateTo) {
      whereClause += ` AND o.created_at <= $${paramIndex}::date + interval '1 day'`
      params.push(dateTo)
      paramIndex++
    }

    // Build ORDER BY clause
    const validSortFields = ['created_at', 'updated_at', 'total', 'status']
    const validSortOrders = ['asc', 'desc']
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC'

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `
    const countResult = await query(countQuery, params)
    const total = parseInt(countResult?.rows[0]?.count || '0')

    // Get orders with user info and item count
    const ordersQuery = `
      SELECT 
        o.*,
        u.email as user_email,
        COUNT(oi.id) as item_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'product_name', p.name
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      ${whereClause}
      GROUP BY o.id, u.email
      ORDER BY o.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(pageSize, offset)
    const result = await query(ordersQuery, params)

    // Format orders for response
    const orders = result?.rows.map(order => ({
      ...order,
      user: {
        email: order.user_email
      }
    })) || []

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        data: orders,
        total,
        page,
        pageSize,
        totalPages
      }
    })

  } catch (error) {
    console.error('GET /api/admin/orders error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}