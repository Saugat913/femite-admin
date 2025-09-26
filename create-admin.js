const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

// Database configuration with SSL for Aiven  
const connectionString = 'postgres://avnadmin:[REDACTED_AIVEN_PASSWORD]@pg-69dd289-saugatkandel913-c05d.d.aivencloud.com:28606/defaultdb?sslmode=require'

// For development/testing with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : false
})

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...')
    
    const adminEmail = 'admin@hempfashion.com'
    const adminPassword = 'admin123'
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
      
      console.log(`✅ Admin user created successfully!`)
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
      console.log('⚠️  Please change the password after first login!')
    } else {
      console.log('ℹ️  Admin user already exists')
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
    }

  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message)
    
    // If users table doesn't exist, create it
    if (error.code === '42P01') {
      console.log('📋 Creating users table...')
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
          );
        `)
        console.log('✅ Users table created, retrying admin user creation...')
        return createAdminUser() // Retry
      } catch (createError) {
        console.error('❌ Failed to create users table:', createError.message)
      }
    }
  } finally {
    await pool.end()
  }
}

createAdminUser()