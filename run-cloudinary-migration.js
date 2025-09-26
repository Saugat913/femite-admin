const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// For development/testing with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

// Database configuration with SSL for Aiven  
const connectionString = 'postgres://avnadmin:[REDACTED_AIVEN_PASSWORD]@pg-69dd289-saugatkandel913-c05d.d.aivencloud.com:28606/defaultdb?sslmode=require'

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