import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { emailService } from '@/lib/email-service'
import { revalidateAfterProductChange } from '@/lib/enhanced-revalidation-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * pageSize

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (category) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM product_categories pc 
        JOIN categories c ON pc.category_id = c.id 
        WHERE pc.product_id = p.id AND c.id = $${paramIndex}
      )`
      params.push(category)
      paramIndex++
    }

    // Build ORDER BY clause
    const validSortFields = ['name', 'price', 'stock', 'created_at', 'updated_at']
    const validSortOrders = ['asc', 'desc']
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC'

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM products p 
      ${whereClause}
    `
    const countResult = await query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)

    // Get products with categories
    const productsQuery = `
      SELECT 
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
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(pageSize, offset)
    const result = await query(productsQuery, params)

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        data: result.rows,
        total,
        page,
        pageSize,
        totalPages
      }
    })

  } catch (error) {
    console.error('GET /api/admin/products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      low_stock_threshold = 10,
      track_inventory = true,
      category_ids = []
    } = body

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and stock are required' },
        { status: 400 }
      )
    }

    // Create product (price is already in correct format)
    const productResult = await query(
      `INSERT INTO products (
        id, name, description, price, stock, image_url, 
        cloudinary_public_id, image_width, image_height,
        low_stock_threshold, track_inventory, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING *`,
      [name, description, price, stock, image_url, cloudinary_public_id, image_width, image_height, low_stock_threshold, track_inventory]
    )

    const product = productResult.rows[0]

    // Add categories if provided
    if (category_ids.length > 0) {
      const categoryInserts = category_ids.map((categoryId: string) => 
        query(
          'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)',
          [product.id, categoryId]
        )
      )
      await Promise.all(categoryInserts)
    }

    // Log inventory movement
    await query(
      `INSERT INTO inventory_logs (
        id, product_id, change_type, quantity_change, 
        previous_stock, new_stock, notes, created_at
      ) VALUES (
        gen_random_uuid(), $1, 'stock_in', $2, 0, $2, 'Initial stock', NOW()
      )`,
      [product.id, stock]
    )

    // Get product with categories
    const productWithCategories = await query(
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
      [product.id]
    )

    const createdProduct = productWithCategories.rows[0]
    
    // Trigger client site cache revalidation for new product with image (async, don't wait for completion)
    revalidateAfterProductChange(createdProduct.id, !!image_url)
    
    // Send newsletter announcement to subscribers (async, don't wait for completion)
    setImmediate(async () => {
      try {
        console.log('🌿 New product created, sending newsletter announcements...')
        
        // Get active newsletter subscribers
        const subscribersResult = await query(
          'SELECT email FROM newsletter_subscriptions WHERE active = true ORDER BY subscribed_at DESC'
        )
        
        if (subscribersResult.rows.length > 0) {
          const subscriberEmails = subscribersResult.rows.map((row: any) => row.email)
          
          // Send bulk newsletter announcement
          const emailResults = await emailService.sendBulkProductAnnouncement(
            {
              id: createdProduct.id,
              name: createdProduct.name,
              description: createdProduct.description,
              price: createdProduct.price,
              image_url: createdProduct.image_url,
              stock: createdProduct.stock,
              categories: createdProduct.categories || []
            },
            subscriberEmails
          )
          
          console.log(`📧 Newsletter announcement sent: ${emailResults.sent} successful, ${emailResults.failed} failed`)
        } else {
          console.log('📧 No active newsletter subscribers found')
        }
      } catch (error) {
        console.error('❌ Error sending newsletter announcement:', error)
        // Don't throw error - we don't want to fail product creation if email fails
      }
    })

    return NextResponse.json({
      success: true,
      data: createdProduct,
      message: 'Product created successfully and newsletter sent to subscribers'
    })

  } catch (error) {
    console.error('POST /api/admin/products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}