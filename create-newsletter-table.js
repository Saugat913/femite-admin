const { Pool } = require('pg')

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

async function createNewsletterTable() {
  try {
    console.log('📧 Creating newsletter subscriptions table...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        active BOOLEAN DEFAULT true,
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        unsubscribed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    
    console.log('✅ Newsletter subscriptions table created!')
    
    // Add a few sample subscriptions
    const sampleEmails = [
      'customer1@example.com',
      'customer2@example.com', 
      'user@hempfashion.com'
    ]
    
    for (const email of sampleEmails) {
      try {
        await pool.query(
          'INSERT INTO newsletter_subscriptions (email, active, subscribed_at) VALUES ($1, $2, NOW()) ON CONFLICT (email) DO NOTHING',
          [email, true]
        )
        console.log(`✅ Added sample subscription: ${email}`)
      } catch (err) {
        // Ignore conflicts
      }
    }

  } catch (error) {
    console.error('❌ Failed to create newsletter table:', error.message)
  } finally {
    await pool.end()
  }
}

createNewsletterTable()