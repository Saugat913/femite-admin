import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Basic UUID validation
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Get order details with customer info
    const orderResult = await query(`
      SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        o.updated_at,
        o.shipping_address,
        o.billing_address,
        u.id as customer_id,
        u.email as customer_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [orderId])

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get order items with product details
    const itemsResult = await query(`
      SELECT 
        oi.id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name as product_name,
        p.sku as product_sku,
        p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `, [orderId])

    const order = orderResult.rows[0]
    const orderData = {
      id: order.id,
      total: parseFloat(order.total) / 100, // Convert cents to dollars
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      shippingAddress: order.shipping_address ? JSON.parse(order.shipping_address) : null,
      billingAddress: order.billing_address ? JSON.parse(order.billing_address) : null,
      customer: {
        id: order.customer_id,
        email: order.customer_email,
        firstName: order.customer_first_name,
        lastName: order.customer_last_name
      },
      items: itemsResult.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price) / 100, // Convert cents to dollars
        product: {
          name: item.product_name,
          sku: item.product_sku,
          image: item.product_image
        }
      }))
    }

    return NextResponse.json({
      success: true,
      data: orderData
    })

  } catch (error) {
    console.error('GET /api/admin/orders/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()
    const { status, shippingAddress, billingAddress } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await query(
      'SELECT id, status FROM orders WHERE id = $1',
      [orderId]
    )

    if (existingOrder.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Build update query based on provided fields
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (status) {
      const validStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid order status' },
          { status: 400 }
        )
      }
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++
    }

    if (shippingAddress) {
      updateFields.push(`shipping_address = $${paramIndex}`)
      updateValues.push(JSON.stringify(shippingAddress))
      paramIndex++
    }

    if (billingAddress) {
      updateFields.push(`billing_address = $${paramIndex}`)
      updateValues.push(JSON.stringify(billingAddress))
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(orderId) // For WHERE clause

    const result = await query(`
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, total, status, created_at, updated_at
    `, updateValues)

    const updatedOrder = result.rows[0]
    updatedOrder.total = parseFloat(updatedOrder.total) / 100 // Convert cents to dollars

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    })

  } catch (error) {
    console.error('PUT /api/admin/orders/[id] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    )
  }
}