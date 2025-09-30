import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get category with product count
    const result = await query(`
      SELECT 
        c.*,
        COUNT(pc.product_id) as product_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [id])

    if (!result || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('GET /api/admin/categories/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const existingCategory = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    )

    if (!existingCategory || existingCategory.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if another category with same name exists
    const duplicateCheck = await query(
      'SELECT id FROM categories WHERE name = $1 AND id != $2',
      [name, id]
    )

    if (duplicateCheck && duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Update category
    const result = await query(
      `UPDATE categories SET 
        name = $1, 
        description = $2, 
        updated_at = NOW()
      WHERE id = $3
      RETURNING *`,
      [name, description, id]
    )

    return NextResponse.json({
      success: true,
      data: result?.rows[0],
      message: 'Category updated successfully'
    })

  } catch (error) {
    console.error('PUT /api/admin/categories/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if category exists
    const existingCategory = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    )

    if (!existingCategory || existingCategory.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category is used by any products
    const productCategories = await query(
      'SELECT COUNT(*) FROM product_categories WHERE category_id = $1',
      [id]
    )

    if (productCategories && parseInt(productCategories.rows[0]?.count || '0') > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category that is assigned to products' },
        { status: 400 }
      )
    }

    // Delete category
    await query('DELETE FROM categories WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })

  } catch (error) {
    console.error('DELETE /api/admin/categories/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}