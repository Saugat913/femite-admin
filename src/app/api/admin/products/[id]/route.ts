import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { revalidateAfterProductChange } from '@/lib/enhanced-revalidation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get product with categories
    const result = await query(
      `SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = $1
      GROUP BY p.id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('GET /api/admin/products/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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
    const {
      name,
      description,
      price,
      stock,
      image_url,
      cloudinary_public_id,
      image_width,
      image_height,
      low_stock_threshold,
      track_inventory,
      category_ids = []
    } = body

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and stock are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const existingProduct = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )

    if (existingProduct.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const oldProduct = existingProduct.rows[0]
    
    // Check if image was updated
    const imageWasUpdated = oldProduct.image_url !== image_url || 
                           oldProduct.cloudinary_public_id !== cloudinary_public_id
    
    if (imageWasUpdated) {
      console.log(`🖼️ Image updated for product ${id}: ${oldProduct.image_url} → ${image_url}`)
    }

    // Update product
    const result = await query(
      `UPDATE products SET 
        name = $1, 
        description = $2, 
        price = $3, 
        stock = $4, 
        image_url = $5,
        cloudinary_public_id = $6,
        image_width = $7,
        image_height = $8,
        low_stock_threshold = $9,
        track_inventory = $10,
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [name, description, price, stock, image_url, cloudinary_public_id, image_width, image_height, low_stock_threshold, track_inventory, id]
    )

    // Log inventory movement if stock changed
    if (oldProduct.stock !== stock) {
      const quantityChange = stock - oldProduct.stock
      await query(
        `INSERT INTO inventory_logs (
          id, product_id, change_type, quantity_change, 
          previous_stock, new_stock, notes, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
        )`,
        [
          id, 
          quantityChange > 0 ? 'stock_in' : 'stock_out',
          quantityChange,
          oldProduct.stock,
          stock,
          'Manual adjustment via admin panel'
        ]
      )
    }

    // Update product categories
    // Remove existing categories
    await query(
      'DELETE FROM product_categories WHERE product_id = $1',
      [id]
    )

    // Add new categories
    if (category_ids.length > 0) {
      const categoryInserts = category_ids.map((categoryId: string) => 
        query(
          'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        )
      )
      await Promise.all(categoryInserts)
    }

    // Get updated product with categories
    const updatedProduct = await query(
      `SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'description', c.description)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = $1
      GROUP BY p.id`,
      [id]
    )

    // Trigger client site cache revalidation with image update flag (async, don't wait for completion)
    revalidateAfterProductChange(id, imageWasUpdated)

    return NextResponse.json({
      success: true,
      data: updatedProduct.rows[0],
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('PUT /api/admin/products/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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

    // Check if product exists
    const existingProduct = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )

    if (existingProduct.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is used in any orders
    const orderItems = await query(
      'SELECT COUNT(*) FROM order_items WHERE product_id = $1',
      [id]
    )

    if (parseInt(orderItems.rows[0].count) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete product that has been ordered' },
        { status: 400 }
      )
    }

    // Delete product (categories and inventory logs will be deleted via CASCADE)
    await query('DELETE FROM products WHERE id = $1', [id])

    // Trigger client site cache revalidation (async, don't wait for completion)
    revalidateAfterProductChange(id)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('DELETE /api/admin/products/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}