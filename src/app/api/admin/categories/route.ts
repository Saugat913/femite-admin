import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get categories with product count
    const result = await query(`
      SELECT 
        c.*,
        COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `)

    return NextResponse.json({
      success: true,
      data: result?.rows || []
    })

  } catch (error) {
    console.error('GET /api/admin/categories error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category with same name already exists
    const existingCategory = await query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    )

    if (existingCategory && existingCategory.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Create category
    const result = await query(
      `INSERT INTO categories (
        id, name, description, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, NOW(), NOW()
      ) RETURNING *`,
      [name, description]
    )

    return NextResponse.json({
      success: true,
      data: result?.rows[0],
      message: 'Category created successfully'
    })

  } catch (error) {
    console.error('POST /api/admin/categories error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    )
  }
}