import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')

    // Build WHERE clause based on filters
    let whereClause = `WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')`
    const params: any[] = []
    let paramIndex = 1

    if (startDate) {
      whereClause += ` AND o.created_at >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND o.created_at <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    if (category) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM order_items oi2
        JOIN products p2 ON oi2.product_id = p2.id
        JOIN product_categories pc2 ON p2.id = pc2.product_id
        WHERE oi2.order_id = o.id AND pc2.category_id = $${paramIndex}
      )`
      params.push(category)
      paramIndex++
    }

    // Get sales data grouped by date
    const salesQuery = `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total), 0) as sales,
        COUNT(DISTINCT o.user_id) as unique_customers,
        AVG(o.total) as avg_order_value
      FROM orders o
      ${whereClause}
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
      LIMIT 365
    `

    const salesResult = await query(salesQuery, params)

    // Format the data
    const salesData = salesResult.rows.map(row => ({
      date: row.date,
      orders: parseInt(row.orders),
      sales: parseFloat(row.sales),
      unique_customers: parseInt(row.unique_customers),
      avg_order_value: parseFloat(row.avg_order_value)
    }))

    return NextResponse.json({
      success: true,
      data: salesData
    })

  } catch (error) {
    console.error('GET /api/admin/analytics/sales error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}