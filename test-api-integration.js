#!/usr/bin/env node

require('dotenv').config({ path: '/home/x/Projects/femite-admin/.env.local' })

const { Pool } = require('pg')

// For development/testing with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function testAPIIntegration() {
  console.log('Testing API Integration between femite and femite-admin...')
  
  // Database connection
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  const requiresSSL = connectionString.includes('aivencloud.com') || 
                     connectionString.includes('sslmode=require') ||
                     process.env.NODE_ENV === 'production'
  
  const pool = new Pool({
    connectionString,
    ssl: requiresSSL 
      ? { rejectUnauthorized: false, checkServerIdentity: false } 
      : false,
  })
  
  const client = await pool.connect()
  
  try {
    // Test 1: Check if we have products
    console.log('\n=== TEST 1: Product Data Consistency ===')
    const productsResult = await client.query(`
      SELECT 
        p.*,
        COUNT(pc.category_id) as category_count
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `)
    
    console.log(`Found ${productsResult.rows.length} products:`)
    productsResult.rows.forEach(product => {
      console.log(`- ${product.name}: $${product.price}, Stock: ${product.stock}, Categories: ${product.category_count}`)
      console.log(`  Cloudinary: ${product.cloudinary_public_id || 'None'}`)
      console.log(`  Image: ${product.image_url ? 'Yes' : 'No'}`)
    })
    
    // Test 2: Check settings table (admin-specific)
    console.log('\n=== TEST 2: Settings Data ===')
    const settingsResult = await client.query(`
      SELECT key, value, category 
      FROM settings 
      WHERE category IN ('store', 'payment', 'shipping')
      ORDER BY category, key
      LIMIT 10
    `)
    
    console.log('Settings configured:')
    settingsResult.rows.forEach(setting => {
      console.log(`- ${setting.category}.${setting.key}: ${setting.value.length > 50 ? setting.value.substring(0, 50) + '...' : setting.value}`)
    })
    
    // Test 3: Check revalidation configuration
    console.log('\n=== TEST 3: Revalidation Configuration ===')
    const clientSiteUrl = process.env.CLIENT_SITE_URL
    const revalidationSecret = process.env.CLIENT_SITE_REVALIDATION_SECRET
    
    console.log(`Client Site URL: ${clientSiteUrl || 'NOT SET'}`)
    console.log(`Revalidation Secret: ${revalidationSecret ? 'SET (' + revalidationSecret.length + ' chars)' : 'NOT SET'}`)
    
    // Test 4: Check environment differences
    console.log('\n=== TEST 4: Environment Configuration ===')
    console.log('Environment variables checked:')
    const envVars = [
      'DATABASE_URL',
      'CLIENT_SITE_URL', 
      'CLIENT_SITE_REVALIDATION_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'JWT_SECRET',
      'SMTP_HOST'
    ]
    
    envVars.forEach(varName => {
      const value = process.env[varName]
      console.log(`- ${varName}: ${value ? 'SET' : 'NOT SET'}`)
    })
    
    // Test 5: Check blog posts (shared data)
    console.log('\n=== TEST 5: Blog Posts ===')
    const blogResult = await client.query(`
      SELECT title, slug, is_published, published_at
      FROM blog_posts 
      ORDER BY published_at DESC NULLS LAST
      LIMIT 3
    `)
    
    console.log(`Found ${blogResult.rows.length} blog posts:`)
    blogResult.rows.forEach(post => {
      console.log(`- ${post.title} (${post.slug}) - ${post.is_published ? 'Published' : 'Draft'}`)
    })
    
    // Test 6: Check user data
    console.log('\n=== TEST 6: User Accounts ===')
    const usersResult = await client.query(`
      SELECT email, is_verified, created_at, role
      FROM users 
      ORDER BY created_at DESC
      LIMIT 3
    `)
    
    console.log(`Found ${usersResult.rows.length} users:`)
    usersResult.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role || 'customer'}) - ${user.is_verified ? 'Verified' : 'Unverified'}`)
    })
    
    // Test 7: Database performance check
    console.log('\n=== TEST 7: Database Performance ===')
    const perfStart = Date.now()
    await client.query(`
      SELECT COUNT(*) as total_records FROM (
        SELECT 'products' as table_name, COUNT(*) as count FROM products
        UNION ALL
        SELECT 'orders' as table_name, COUNT(*) as count FROM orders
        UNION ALL
        SELECT 'users' as table_name, COUNT(*) as count FROM users
        UNION ALL
        SELECT 'blog_posts' as table_name, COUNT(*) as count FROM blog_posts
      ) counts
    `)
    const perfEnd = Date.now()
    console.log(`Database query time: ${perfEnd - perfStart}ms`)
    
    console.log('\n✅ API Integration test completed successfully!')
    
  } catch (error) {
    console.error('❌ API Integration test failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Run the test
testAPIIntegration().catch(console.error)