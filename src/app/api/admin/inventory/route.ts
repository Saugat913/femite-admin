import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // low_stock, out_of_stock, in_stock

    const offset = (page - 1) * limit

    // Build the query based on filters
    let whereClause = 'WHERE track_inventory = true'
    let queryParams = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND name ILIKE $${paramIndex}`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (status === 'low_stock') {
      whereClause += ` AND stock <= low_stock_threshold AND stock > 0`
    } else if (status === 'out_of_stock') {
      whereClause += ` AND stock = 0`
    } else if (status === 'in_stock') {
      whereClause += ` AND stock > low_stock_threshold`
    }

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      queryParams
    )
    const total = parseInt(countResult.rows[0].count)

    // Get inventory items with pagination
    const inventoryResult = await query(
      `SELECT 
        id, 
        name, 
        stock, 
        low_stock_threshold,
        price,
        track_inventory,
        created_at, 
        updated_at
      FROM products
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN stock = 0 THEN 0
          WHEN stock <= low_stock_threshold THEN 1
          ELSE 2
        END,
        stock ASC,
        name ASC
      LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    )

    // Get inventory statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE stock > low_stock_threshold) as in_stock,
        COUNT(*) FILTER (WHERE stock <= low_stock_threshold AND stock > 0) as low_stock,
        COUNT(*) FILTER (WHERE stock = 0) as out_of_stock,
        COALESCE(SUM(stock * price), 0) as total_inventory_value
      FROM products
      WHERE track_inventory = true
    `)

    const stats = statsResult.rows[0] || {
      total_products: 0,
      in_stock: 0,
      low_stock: 0,
      out_of_stock: 0,
      total_inventory_value: 0
    }

    // Get recent inventory movements
    const movementsResult = await query(`
      SELECT 
        il.id,
        il.product_id,
        il.change_type,
        il.quantity_change,
        il.notes,
        il.created_at,
        p.name as product_name
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      ORDER BY il.created_at DESC
      LIMIT 10
    `)

    // Format inventory items with status
    const inventoryItems = inventoryResult.rows.map(item => ({
      ...item,
      price: parseFloat(item.price),
      status: item.stock === 0 ? 'out_of_stock' : 
              item.stock <= item.low_stock_threshold ? 'low_stock' : 'in_stock'
    }))

    return NextResponse.json({
      success: true,
      data: {
        inventory: inventoryItems,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: total,
          perPage: limit
        },
        stats: {
          totalProducts: parseInt(stats.total_products),
          inStock: parseInt(stats.in_stock),
          lowStock: parseInt(stats.low_stock),
          outOfStock: parseInt(stats.out_of_stock),
          totalValue: parseFloat(stats.total_inventory_value)
        },
        recentMovements: movementsResult.rows
      }
    })

  } catch (error) {
    console.error('GET /api/admin/inventory error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity, reason, notes } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product ID and quantity are required' },
        { status: 400 }
      )
    }

    // Get current product stock
    const productResult = await query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = productResult.rows[0]
    const previousStock = product.stock
    const newStock = previousStock + quantity

    // Prevent negative stock
    if (newStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock for this adjustment' },
        { status: 400 }
      )
    }

    // Update product stock
    await query(
      'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, productId]
    )

    // Create inventory log entry
    await query(`
      INSERT INTO inventory_logs (
        id, product_id, change_type, quantity_change, 
        previous_stock, new_stock, notes, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
      )
    `, [productId, reason, quantity, previousStock, newStock, notes])

    return NextResponse.json({
      success: true,
      data: {
        product_id: productId,
        previous_stock: previousStock,
        new_stock: newStock,
        quantity_change: quantity
      },
      message: 'Stock adjusted successfully'
    })

  } catch (error) {
    console.error('POST /api/admin/inventory error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
