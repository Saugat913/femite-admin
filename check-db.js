#!/usr/bin/env node

// For development/testing with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const { Pool } = require('pg')

async function checkDatabase() {
  console.log('Checking database state...')
  
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
    // List all tables
    console.log('\n=== EXISTING TABLES ===')
    const tablesResult = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in database')
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`${row.table_name} (${row.table_type})`)
      })
    }
    
    // Check if migrations table exists and list executed migrations
    console.log('\n=== EXECUTED MIGRATIONS ===')
    try {
      const migrationsResult = await client.query('SELECT filename, executed_at FROM migrations ORDER BY executed_at')
      if (migrationsResult.rows.length === 0) {
        console.log('No migrations executed yet')
      } else {
        migrationsResult.rows.forEach(row => {
          console.log(`${row.filename} - ${row.executed_at}`)
        })
      }
    } catch (error) {
      console.log('Migrations table does not exist')
    }
    
    // Check products table structure if it exists
    try {
      console.log('\n=== PRODUCTS TABLE STRUCTURE ===')
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        ORDER BY ordinal_position
      `)
      
      if (columnsResult.rows.length > 0) {
        columnsResult.rows.forEach(row => {
          console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`)
        })
      } else {
        console.log('Products table not found')
      }
    } catch (error) {
      console.log('Could not check products table structure')
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Check database
checkDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
