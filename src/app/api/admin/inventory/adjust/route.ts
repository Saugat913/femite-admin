import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, adjustmentType, quantity, notes } = body

    // Validate required fields
    if (!productId || !adjustmentType || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Product ID, adjustment type, and quantity are required' },
        { status: 400 }
      )
    }

    // Validate adjustment type
    const validTypes = ['restock', 'sold', 'damaged', 'returned', 'adjustment']
    if (!validTypes.includes(adjustmentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid adjustment type' },
        { status: 400 }
      )
    }

    // Validate quantity
    const adjustmentQuantity = parseInt(quantity)
    if (isNaN(adjustmentQuantity) || adjustmentQuantity === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quantity' },
        { status: 400 }
      )
    }

    // Check if product exists and get current stock
    const productResult = await query(
      'SELECT id, name, stock, track_inventory FROM products WHERE id = $1',
      [productId]
    )

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = productResult.rows[0]

    if (!product.track_inventory) {
      return NextResponse.json(
        { success: false, error: 'Product does not track inventory' },
        { status: 400 }
      )
    }

    const currentStock = parseInt(product.stock)

    // Calculate new stock based on adjustment type
    let newStock = currentStock
    let logQuantity = adjustmentQuantity

    switch (adjustmentType) {
      case 'restock':
      case 'returned':
        newStock = currentStock + adjustmentQuantity
        break
      case 'sold':
      case 'damaged':
        newStock = Math.max(0, currentStock - adjustmentQuantity)
        logQuantity = -adjustmentQuantity // Negative for decreases
        break
      case 'adjustment':
        // For direct adjustments, the quantity is the new stock level
        newStock = adjustmentQuantity
        logQuantity = adjustmentQuantity - currentStock
        break
    }

    // Ensure stock doesn't go negative
    if (newStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock for this adjustment' },
        { status: 400 }
      )
    }

    // Start a transaction
    await query('BEGIN')

    try {
      // Update product stock
      await query(
        'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2',
        [newStock, productId]
      )

      // Log the inventory movement
      await query(`
        INSERT INTO inventory_logs (
          id, product_id, change_type, quantity_change, 
          previous_stock, new_stock, notes, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
        )
      `, [productId, adjustmentType, logQuantity, currentStock, newStock, notes || ''])

      // Commit transaction
      await query('COMMIT')

      // Get updated product info
      const updatedProductResult = await query(
        'SELECT id, name, stock, low_stock_threshold FROM products WHERE id = $1',
        [productId]
      )

      const updatedProduct = updatedProductResult.rows[0]

      return NextResponse.json({
        success: true,
        data: {
          product: {
            ...updatedProduct,
            status: updatedProduct.stock === 0 ? 'out_of_stock' : 
                   updatedProduct.stock <= updatedProduct.low_stock_threshold ? 'low_stock' : 'in_stock'
          },
          adjustment: {
            type: adjustmentType,
            quantity: logQuantity,
            previousStock: currentStock,
            newStock: newStock,
            notes: notes || ''
          }
        },
        message: 'Inventory adjusted successfully'
      })

    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('POST /api/admin/inventory/adjust error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to adjust inventory' },
      { status: 500 }
    )
  }
}