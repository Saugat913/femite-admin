import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const changeType = searchParams.get('changeType') // filter by movement type

    const offset = (page - 1) * pageSize

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (productId) {
      whereClause += ` AND il.product_id = $${paramIndex}`
      params.push(productId)
      paramIndex++
    }

    if (changeType) {
      whereClause += ` AND il.change_type = $${paramIndex}`
      params.push(changeType)
      paramIndex++
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM inventory_logs il
      ${whereClause}
    `
    const countResult = await query(countQuery, params)
    const total = parseInt(countResult?.rows[0]?.count || '0')

    // Get movements with product information
    const movementsQuery = `
      SELECT 
        il.*,
        p.name as product_name,
        p.price as product_price
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      ${whereClause}
      ORDER BY il.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(pageSize, offset)
    const result = await query(movementsQuery, params)

    // Format the movements data
    const movements = result?.rows.map(movement => ({
      id: movement.id,
      product_id: movement.product_id,
      product_name: movement.product_name,
      product_price: parseFloat(movement.product_price || 0),
      change_type: movement.change_type,
      quantity_change: movement.quantity_change,
      previous_stock: movement.previous_stock,
      new_stock: movement.new_stock,
      reference_id: movement.reference_id,
      notes: movement.notes,
      created_at: movement.created_at
    }))

    // Get movement type statistics
    const typeStatsQuery = `
      SELECT 
        change_type,
        COUNT(*) as count,
        SUM(ABS(quantity_change)) as total_quantity
      FROM inventory_logs il
      ${productId ? 'WHERE il.product_id = $1' : ''}
      GROUP BY change_type
      ORDER BY count DESC
    `
    const typeStatsParams = productId ? [productId] : []
    const typeStatsResult = await query(typeStatsQuery, typeStatsParams)

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        movements,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        },
        typeStats: typeStatsResult?.rows || []
      }
    })

  } catch (error) {
    console.error('GET /api/admin/inventory/movements error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory movements' },
      { status: 500 }
    )
  }
}