const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// For development/testing with self-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// Database configuration using environment variable
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/defaultdb'

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : false
})

async function runMigration() {
  try {
    console.log('🔧 Running Cloudinary migration...')
    
    const migrationPath = path.join(__dirname, 'migrations', '20250915160000_add_cloudinary_fields.sql')
    const sqlContent = fs.readFileSync(migrationPath, 'utf8')
    
    await pool.query(sqlContent)
    
    console.log('✅ Cloudinary migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  } finally {
    await pool.end()
  }
}

runMigration()