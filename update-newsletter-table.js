const { Pool } = require('pg')

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

async function updateNewsletterTable() {
  try {
    console.log('📧 Updating newsletter subscriptions table...')
    
    // Add source column if it doesn't exist
    await pool.query(`
      ALTER TABLE newsletter_subscriptions 
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
    `)
    
    console.log('✅ Newsletter subscriptions table updated!')
    
    // Update existing records to have a source
    await pool.query(`
      UPDATE newsletter_subscriptions 
      SET source = 'website' 
      WHERE source IS NULL;
    `)
    
    console.log('✅ Updated existing records with source!')
    
  } catch (error) {
    console.error('❌ Failed to update newsletter table:', error.message)
  } finally {
    await pool.end()
  }
}

updateNewsletterTable()