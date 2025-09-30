import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { cachedQuery, CACHE_TTL, CACHE_TAGS } from '@/lib/cache'
import { unstable_cache } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    // Check for cache bypass parameter (for admin refresh)
    const url = new URL(request.url)
    const bypassCache = url.searchParams.get('refresh') === 'true'
    
    if (bypassCache) {
      console.log('Dashboard cache bypass requested')
    }

    // Use Next.js unstable_cache for ISR compatibility
    const getDashboardData = unstable_cache(
      async () => {
        console.log('Fetching fresh dashboard data from database')
        
        // Get today's date for calculations
        const today = new Date()
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000))
        const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))

    // Run all queries in parallel for better performance
    const [
      totalOrdersResult,
      totalRevenueResult,
      totalCustomersResult,
      totalProductsResult,
      recentOrdersResult,
      lowStockProductsResult,
      monthlyRevenueResult,
      weeklyOrdersResult,
      topProductsResult,
      newsletterSubscribersResult
    ] = await Promise.all([
      // Total Orders
      query(`
        SELECT COUNT(*) as total_orders,
               SUM(CASE WHEN COALESCE(status_v2, status) = 'paid' THEN 1 ELSE 0 END) as paid_orders,
               SUM(CASE WHEN COALESCE(status_v2, status) = 'processing' THEN 1 ELSE 0 END) as processing_orders,
               SUM(CASE WHEN COALESCE(status_v2, status) = 'shipped' THEN 1 ELSE 0 END) as shipped_orders
        FROM orders
      `),
      
      // Total Revenue  
      query(`
        SELECT 
          COALESCE(SUM(COALESCE(total_amount, total)), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at >= $1 THEN COALESCE(total_amount, total) ELSE 0 END), 0) as monthly_revenue,
          COALESCE(SUM(CASE WHEN created_at >= $2 THEN COALESCE(total_amount, total) ELSE 0 END), 0) as weekly_revenue
        FROM orders 
        WHERE COALESCE(status_v2, status) = 'paid'
      `, [thirtyDaysAgo, sevenDaysAgo]),
      
      // Total Customers
      query(`
        SELECT 
          COUNT(*) as total_customers,
          SUM(CASE WHEN created_at >= $1 THEN 1 ELSE 0 END) as monthly_new_customers,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users
        FROM users
      `, [thirtyDaysAgo]),
      
      // Total Products
      query(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END) as in_stock_products,
          SUM(CASE WHEN stock <= 5 AND stock > 0 THEN 1 ELSE 0 END) as low_stock_products,
          SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_products
        FROM products
      `),
      
      // Recent Orders (last 5)
      query(`
        SELECT 
          o.id, 
          COALESCE(o.total_amount, o.total) as total_amount, 
          COALESCE(o.status_v2, o.status) as status_v2, 
          o.created_at,
          u.email as customer_email,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id, COALESCE(o.total_amount, o.total), COALESCE(o.status_v2, o.status), o.created_at, u.email
        ORDER BY o.created_at DESC
        LIMIT 5
      `),
      
      // Low Stock Products
      query(`
        SELECT id, name, stock, price
        FROM products
        WHERE stock <= COALESCE(low_stock_threshold, 5) AND stock > 0 AND track_inventory = true
        ORDER BY stock ASC
        LIMIT 5
      `),
      
      // Monthly Revenue Chart (last 12 months)
      query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COALESCE(SUM(COALESCE(total_amount, total)), 0) as revenue,
          COUNT(*) as order_count
        FROM orders
        WHERE COALESCE(status_v2, status) = 'paid' 
          AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `),
      
      // Weekly Orders (last 4 weeks)
      query(`
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) as order_count
        FROM orders
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '3 weeks')
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week
      `),
      
      // Top Products by Revenue
      query(`
        SELECT 
          p.id, p.name, p.price,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        WHERE COALESCE(o.status_v2, o.status) = 'paid'
        GROUP BY p.id, p.name, p.price
        ORDER BY total_revenue DESC
        LIMIT 5
      `),
      
      // Newsletter Subscribers
      query(`
        SELECT 
          COUNT(*) as total_subscribers,
          SUM(CASE WHEN subscribed_at >= $1 THEN 1 ELSE 0 END) as monthly_new_subscribers
        FROM newsletter_subscriptions
        WHERE active = true
      `, [thirtyDaysAgo])
    ])

    // Process the data
    const dashboard = {
      overview: {
        totalOrders: parseInt(totalOrdersResult?.rows[0]?.total_orders || '0'),
        paidOrders: parseInt(totalOrdersResult?.rows[0]?.paid_orders || '0'),
        processingOrders: parseInt(totalOrdersResult?.rows[0]?.processing_orders || '0'),
        shippedOrders: parseInt(totalOrdersResult?.rows[0]?.shipped_orders || '0'),
        
        totalRevenue: parseFloat(totalRevenueResult?.rows[0]?.total_revenue || '0'),
        monthlyRevenue: parseFloat(totalRevenueResult?.rows[0]?.monthly_revenue || '0'),
        weeklyRevenue: parseFloat(totalRevenueResult?.rows[0]?.weekly_revenue || '0'),
        
        totalCustomers: parseInt(totalCustomersResult?.rows[0]?.total_customers || '0'),
        monthlyNewCustomers: parseInt(totalCustomersResult?.rows[0]?.monthly_new_customers || '0'),
        adminUsers: parseInt(totalCustomersResult?.rows[0]?.admin_users || '0'),
        
        totalProducts: parseInt(totalProductsResult?.rows[0]?.total_products || '0'),
        inStockProducts: parseInt(totalProductsResult?.rows[0]?.in_stock_products || '0'),
        lowStockProducts: parseInt(totalProductsResult?.rows[0]?.low_stock_products || '0'),
        outOfStockProducts: parseInt(totalProductsResult?.rows[0]?.out_of_stock_products || '0'),
        
        totalNewsletterSubscribers: parseInt(newsletterSubscribersResult?.rows[0]?.total_subscribers || '0'),
        monthlyNewSubscribers: parseInt(newsletterSubscribersResult?.rows[0]?.monthly_new_subscribers || '0'),
      },
      
      recentOrders: recentOrdersResult?.rows.map(order => ({
        id: order.id,
        amount: parseFloat(order.total_amount || '0'),
        status: order.status_v2,
        customerEmail: order.customer_email,
        itemCount: parseInt(order.item_count || '0'),
        createdAt: order.created_at
      })) || [],
      
      lowStockProducts: lowStockProductsResult?.rows.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        price: parseFloat(product.price || '0')
      })) || [],
      
      monthlyRevenue: monthlyRevenueResult?.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue || '0'),
        orderCount: parseInt(row.order_count || '0')
      })) || [],
      
      weeklyOrders: weeklyOrdersResult?.rows.map(row => ({
        week: row.week,
        orderCount: parseInt(row.order_count || '0')
      })) || [],
      
      topProducts: topProductsResult?.rows.map(product => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price || '0'),
        totalSold: parseInt(product.total_sold || '0'),
        totalRevenue: parseFloat(product.total_revenue || '0')
      })) || []
    }

        return {
          success: true,
          data: dashboard,
          cached: !bypassCache,
          timestamp: new Date().toISOString()
        }
      },
      ['dashboard-data'],
      {
        revalidate: bypassCache ? 0 : 300, // 5 minutes ISR revalidation
        tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.ORDERS, CACHE_TAGS.PRODUCTS, CACHE_TAGS.ANALYTICS]
      }
    )

    const result = await getDashboardData()
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    )
  }
}