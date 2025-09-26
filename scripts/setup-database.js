const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

// Database configuration
require('dotenv').config({ path: '.env.local' })
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

// SSL configuration for cloud databases
const requiresSSL = connectionString.includes('aivencloud.com') || 
                  connectionString.includes('sslmode=require') ||
                  process.env.NODE_ENV === 'production'

const sslConfig = requiresSSL 
  ? { 
      rejectUnauthorized: false, 
      checkServerIdentity: () => undefined,
      secureProtocol: 'TLSv1_2_method'
    }
  : false

const pool = new Pool({
  connectionString,
  ssl: sslConfig
})

async function setupDatabase() {
  console.log('🌱 Setting up Hemp Admin Database...')
  
  try {
    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '../migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    console.log(`📁 Found ${migrationFiles.length} migration files`)

    for (const file of migrationFiles) {
      console.log(`⚡ Executing migration: ${file}`)
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await pool.query(sqlContent)
      console.log(`✅ Migration ${file} completed`)
    }

    // Create default admin user
    console.log('👤 Creating default admin user...')
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hempfashion.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Check if admin user already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    )

    if (existingAdmin.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (id, email, password_hash, role, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      `, [adminEmail, hashedPassword, 'admin'])
      
      console.log(`✅ Admin user created: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
      console.log('⚠️  Please change the default password after first login!')
    } else {
      console.log('ℹ️  Admin user already exists, skipping creation')
    }

    // Create sample categories
    console.log('📂 Creating sample categories...')
    const categories = [
      { name: 'T-Shirts', description: 'Comfortable hemp t-shirts' },
      { name: 'Jeans', description: 'Durable hemp denim jeans' },
      { name: 'Dresses', description: 'Elegant hemp dresses' },
      { name: 'Accessories', description: 'Hemp accessories and bags' },
      { name: 'Jackets', description: 'Hemp jackets and outerwear' }
    ]

    for (const category of categories) {
      const existing = await pool.query(
        'SELECT id FROM categories WHERE name = $1',
        [category.name]
      )
      
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO categories (id, name, description, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())',
          [category.name, category.description]
        )
        console.log(`✅ Category created: ${category.name}`)
      }
    }

    // Create sample products
    console.log('🛍️  Creating sample products...')
    
    const tshirtCategory = await pool.query(
      'SELECT id FROM categories WHERE name = $1',
      ['T-Shirts']
    )
    
    if (tshirtCategory.rows.length > 0) {
      const categoryId = tshirtCategory.rows[0].id
      
      const sampleProducts = [
        {
          name: 'Hemp Classic Tee',
          description: 'A comfortable classic hemp t-shirt perfect for everyday wear.',
          price: 25.00,
          stock: 50,
          category_id: categoryId
        },
        {
          name: 'Hemp Eco Shirt',
          description: 'Eco-friendly hemp shirt made from 100% organic hemp.',
          price: 35.00,
          stock: 30,
          category_id: categoryId
        }
      ]

      for (const product of sampleProducts) {
        const existing = await pool.query(
          'SELECT id FROM products WHERE name = $1',
          [product.name]
        )
        
        if (existing.rows.length === 0) {
          // Create product
          const productResult = await pool.query(`
            INSERT INTO products (
              id, name, description, price, stock, created_at, updated_at
            ) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
            RETURNING id
          `, [
            product.name, product.description, product.price, product.stock
          ])
          
          const productId = productResult.rows[0].id
          
          // Link to category
          await pool.query(
            'INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)',
            [productId, product.category_id]
          )
          
          console.log(`✅ Product created: ${product.name}`)
        }
      }
    }

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📋 Summary:')
    console.log('• Database schema created')
    console.log('• Admin user created')
    console.log('• Sample categories and products added')
    console.log('• Settings configured')
    console.log('\n🚀 You can now start the admin panel with: npm run dev')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run setup
setupDatabase()