import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all products with low or zero stock
    const lowStockQuery = `
      SELECT 
        p.*,
        CASE 
          WHEN p.stock = 0 THEN 'out_of_stock'
          WHEN p.stock <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.track_inventory = true 
        AND p.stock <= p.low_stock_threshold
      GROUP BY p.id
      ORDER BY 
        CASE WHEN p.stock = 0 THEN 0 ELSE 1 END,
        p.stock ASC,
        p.name ASC
    `

    const result = await query(lowStockQuery)

    // Calculate stats
    const rows = result?.rows || []
    const outOfStock = rows.filter(p => p.stock === 0)
    const lowStock = rows.filter(p => p.stock > 0 && p.stock <= p.low_stock_threshold)
    
    const stats = {
      total_low_stock_items: rows.length,
      out_of_stock_items: outOfStock.length,
      low_stock_items: lowStock.length,
      total_value_at_risk: rows.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        products: rows,
        stats
      }
    })

  } catch (error) {
    console.error('GET /api/admin/inventory/low-stock error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch low stock products' },
      { status: 500 }
    )
  }
}