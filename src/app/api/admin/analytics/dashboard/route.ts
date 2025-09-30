import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get overview statistics
    const [
      ordersResult,
      revenueResult,
      customersResult,
      productsResult,
      lowStockResult,
      recentOrdersResult,
      topProductsResult,
      salesTrendResult
    ] = await Promise.all([
      // Total orders
      query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
          COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
          COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
          COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_orders
        FROM orders
      `),
      
      // Revenue statistics
      query(`
        SELECT 
          COALESCE(SUM(total), 0) as total_revenue,
          COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as monthly_revenue,
          COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as weekly_revenue
        FROM orders 
        WHERE status IN ('paid', 'processing', 'shipped', 'delivered')
      `),
      
      // Customer statistics
      query(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_new_customers
        FROM users 
        WHERE role = 'client'
      `),
      
      // Product statistics
      query(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(*) FILTER (WHERE stock > 0) as in_stock_products,
          COUNT(*) FILTER (WHERE stock <= low_stock_threshold) as low_stock_products,
          COUNT(*) FILTER (WHERE stock = 0) as out_of_stock_products
        FROM products
      `),
      
      // Low stock products
      query(`
        SELECT id, name, stock, price, low_stock_threshold
        FROM products 
        WHERE stock <= low_stock_threshold AND track_inventory = true
        ORDER BY stock ASC 
        LIMIT 10
      `),
      
      // Recent orders
      query(`
        SELECT 
          o.id,
          o.total,
          o.status,
          o.created_at,
          u.email as customer_email,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id, u.email
        ORDER BY o.created_at DESC 
        LIMIT 10
      `),
      
      // Top products by revenue
      query(`
        SELECT 
          p.id,
          p.name,
          p.price,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
        GROUP BY p.id, p.name, p.price
        ORDER BY total_revenue DESC
        LIMIT 5
      `),
      
      // Sales trend (last 30 days)
      query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total), 0) as sales
        FROM orders 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND status IN ('paid', 'processing', 'shipped', 'delivered')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `)
    ])

    // Format the data for response
    const overview = {
      totalOrders: parseInt(ordersResult?.rows[0]?.total_orders || '0'),
      paidOrders: parseInt(ordersResult?.rows[0]?.paid_orders || '0'),
      processingOrders: parseInt(ordersResult?.rows[0]?.processing_orders || '0'),
      shippedOrders: parseInt(ordersResult?.rows[0]?.shipped_orders || '0'),
      pendingOrders: parseInt(ordersResult?.rows[0]?.pending_orders || '0'),
      
      totalRevenue: parseInt(revenueResult?.rows[0]?.total_revenue || '0'),
      monthlyRevenue: parseInt(revenueResult?.rows[0]?.monthly_revenue || '0'),
      weeklyRevenue: parseInt(revenueResult?.rows[0]?.weekly_revenue || '0'),
      
      totalCustomers: parseInt(customersResult?.rows[0]?.total_customers || '0'),
      monthlyNewCustomers: parseInt(customersResult?.rows[0]?.monthly_new_customers || '0'),
      
      totalProducts: parseInt(productsResult?.rows[0]?.total_products || '0'),
      inStockProducts: parseInt(productsResult?.rows[0]?.in_stock_products || '0'),
      lowStockProducts: parseInt(productsResult?.rows[0]?.low_stock_products || '0'),
      outOfStockProducts: parseInt(productsResult?.rows[0]?.out_of_stock_products || '0'),
      
      totalNewsletterSubscribers: 0, // Placeholder - implement if needed
      monthlyNewSubscribers: 0
    }

    // Format recent orders
    const recentOrders = recentOrdersResult?.rows?.map(order => ({
      id: order.id,
      amount: parseFloat(order.total), // Already in dollars
      status: order.status,
      customerEmail: order.customer_email,
      itemCount: parseInt(order.item_count),
      createdAt: order.created_at
    })) || []

    // Format low stock products
    const lowStockProducts = lowStockResult?.rows?.map(product => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      price: parseFloat(product.price), // Already in dollars
      threshold: product.low_stock_threshold
    })) || []

    // Format top products
    const topProducts = topProductsResult?.rows?.map(product => ({
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) // Already in decimal format
      },
      totalSold: parseInt(product.total_sold),
      revenue: parseFloat(product.total_revenue)
    })) || []

    // Format sales trend
    const salesTrend = salesTrendResult?.rows?.map(item => ({
      date: item.date,
      sales: parseInt(item.sales),
      orders: parseInt(item.orders)
    })) || []

    const dashboardData = {
      overview,
      recentOrders,
      lowStockProducts,
      topProducts,
      salesTrend,
      totalOrders: overview.totalOrders,
      totalRevenue: overview.totalRevenue,
      totalProducts: overview.totalProducts,
      totalCustomers: overview.totalCustomers,
      pendingOrders: overview.pendingOrders
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('GET /api/admin/analytics/dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}