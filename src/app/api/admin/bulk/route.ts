import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { revalidateAfterBulkChange } from '@/lib/revalidation-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, resource, ids, data } = body

    // Validate required fields
    if (!action || !resource || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action, resource, and IDs array are required' },
        { status: 400 }
      )
    }

    // Validate resource type
    const validResources = ['products', 'orders', 'users']
    if (!validResources.includes(resource)) {
      return NextResponse.json(
        { success: false, error: 'Invalid resource type' },
        { status: 400 }
      )
    }

    // Convert IDs to integers and validate
    const numericIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id))
    if (numericIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid IDs provided' },
        { status: 400 }
      )
    }

    const placeholders = numericIds.map((_, i) => `$${i + 1}`).join(',')
    let result = { success: true, message: '', affected: 0 }

    // Start transaction
    await query('BEGIN')

    try {
      switch (resource) {
        case 'products':
          result = await handleProductBulkAction(action, numericIds, placeholders, data)
          break
        case 'orders':
          result = await handleOrderBulkAction(action, numericIds, placeholders, data)
          break
        case 'users':
          result = await handleUserBulkAction(action, numericIds, placeholders, data)
          break
        default:
          throw new Error('Invalid resource')
      }

      // Commit transaction
      await query('COMMIT')
      
      // Trigger client site cache revalidation for bulk operations (async, don't wait for completion)
      if (resource === 'products' && result.affected > 0) {
        revalidateAfterBulkChange()
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: result.message
      })

    } catch (error) {
      // Rollback on error
      await query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('POST /api/admin/bulk error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform bulk operation'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

async function handleProductBulkAction(action: string, ids: number[], placeholders: string, data?: any) {
  let queryText = ''
  let queryParams = [...ids]

  switch (action) {
    case 'delete':
      // Check if any products have existing orders
      const orderCheckResult = await query(`
        SELECT DISTINCT oi.product_id 
        FROM order_items oi 
        WHERE oi.product_id IN (${placeholders})
      `, ids)

      if (orderCheckResult && orderCheckResult.rows.length > 0) {
        throw new Error('Cannot delete products that have been ordered')
      }

      queryText = `DELETE FROM products WHERE id IN (${placeholders})`
      break

    case 'update_category':
      if (!data?.categoryId) {
        throw new Error('Category ID is required for category update')
      }
      queryText = `UPDATE products SET category_id = $${ids.length + 1}, updated_at = NOW() WHERE id IN (${placeholders})`
      queryParams.push(data.categoryId)
      break

    case 'update_status':
      // Products don't have an active field - this case is not supported for products
      throw new Error('Update status is not supported for products')

    case 'adjust_stock':
      if (data?.adjustment === undefined) {
        throw new Error('Stock adjustment value is required')
      }
      const adjustment = parseInt(data.adjustment)
      queryText = `
        UPDATE products 
        SET stock = GREATEST(0, stock + $${ids.length + 1}), updated_at = NOW() 
        WHERE id IN (${placeholders}) AND track_inventory = true
      `
      queryParams.push(adjustment)

      // Log inventory movements for each product
      for (const productId of ids) {
        await query(`
          INSERT INTO inventory_logs (product_id, type, quantity, notes, created_at)
          VALUES ($1, 'adjustment', $2, $3, NOW())
        `, [productId, adjustment, `Bulk adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`])
      }
      break

    default:
      throw new Error(`Invalid action: ${action}`)
  }

  const result = await query(queryText, queryParams)
  return {
    success: true,
    message: `Successfully ${action.replace('_', ' ')}d ${result?.rowCount || 0} product(s)`,
    affected: result?.rowCount || 0
  }
}

async function handleOrderBulkAction(action: string, ids: number[], placeholders: string, data?: any) {
  let queryText = ''
  let queryParams = [...ids]

  switch (action) {
    case 'update_status':
      if (!data?.status) {
        throw new Error('Status is required for status update')
      }

      const validStatuses = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
      if (!validStatuses.includes(data.status)) {
        throw new Error('Invalid order status')
      }

      queryText = `UPDATE orders SET status = $${ids.length + 1}, updated_at = NOW() WHERE id IN (${placeholders})`
      queryParams.push(data.status)
      break

    case 'cancel':
      queryText = `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id IN (${placeholders}) AND status NOT IN ('delivered', 'cancelled', 'refunded')`
      break

    default:
      throw new Error(`Invalid action: ${action}`)
  }

  const result = await query(queryText, queryParams)
  return {
    success: true,
    message: `Successfully ${action.replace('_', ' ')}d ${result?.rowCount || 0} order(s)`,
    affected: result?.rowCount || 0
  }
}

async function handleUserBulkAction(action: string, ids: number[], placeholders: string, data?: any) {
  let queryText = ''
  let queryParams = [...ids]

  switch (action) {
    case 'delete':
      // Check if any users have existing orders
      const orderCheckResult = await query(`
        SELECT DISTINCT user_id 
        FROM orders 
        WHERE user_id IN (${placeholders})
      `, ids)

      if (orderCheckResult && orderCheckResult.rows.length > 0) {
        throw new Error('Cannot delete users who have placed orders')
      }

      queryText = `DELETE FROM users WHERE id IN (${placeholders}) AND role != 'admin'`
      break

    case 'update_role':
      if (!data?.role) {
        throw new Error('Role is required for role update')
      }

      const validRoles = ['admin', 'client']
      if (!validRoles.includes(data.role)) {
        throw new Error('Invalid user role')
      }

      queryText = `UPDATE users SET role = $${ids.length + 1}, updated_at = NOW() WHERE id IN (${placeholders})`
      queryParams.push(data.role)
      break

    case 'activate':
      queryText = `UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`
      break

    case 'deactivate':
      queryText = `UPDATE users SET email_verified_at = NULL, updated_at = NOW() WHERE id IN (${placeholders})`
      break

    default:
      throw new Error(`Invalid action: ${action}`)
  }

  const result = await query(queryText, queryParams)
  return {
    success: true,
    message: `Successfully ${action.replace('_', ' ')}d ${result?.rowCount || 0} user(s)`,
    affected: result?.rowCount || 0
  }
}