#!/usr/bin/env node

require('dotenv').config({ path: '/home/x/Projects/femite-admin/.env.local' })

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// For development/testing with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function runMissingMigrations() {
  console.log('Running missing migrations...')
  
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
    // Get list of executed migrations
    const executedResult = await client.query('SELECT filename FROM migrations')
    const executedMigrations = new Set(executedResult.rows.map(row => row.filename))
    
    // Migrations to run (in order)
    const migrationsToRun = [
      '005_add_refresh_tokens.sql',
      '006_create_settings_table.sql', 
      '20250915040000_add_email_verification.sql',
      '20250915160000_add_cloudinary_fields.sql'
    ]
    
    for (const migrationFile of migrationsToRun) {
      if (executedMigrations.has(migrationFile)) {
        console.log(`✓ ${migrationFile} - Already executed`)
        continue
      }
      
      // Try to find the migration file in either project
      let migrationPath = null
      const adminPath = `/home/x/Projects/femite-admin/migrations/${migrationFile}`
      const femitePath = `/home/x/Projects/femite/migrations/${migrationFile}`
      
      if (fs.existsSync(adminPath)) {
        migrationPath = adminPath
      } else if (fs.existsSync(femitePath)) {
        migrationPath = femitePath
      } else {
        console.log(`❌ ${migrationFile} - File not found in either project`)
        continue
      }
      
      console.log(`🔄 Running ${migrationFile}...`)
      
      try {
        // Read and execute the migration
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
        
        // Start transaction
        await client.query('BEGIN')
        
        // Execute the migration
        await client.query(migrationSQL)
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (filename, executed_at) VALUES ($1, NOW())',
          [migrationFile]
        )
        
        // Commit transaction
        await client.query('COMMIT')
        
        console.log(`✅ ${migrationFile} - Executed successfully`)
        
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK')
        console.error(`❌ ${migrationFile} - Failed:`, error.message)
        
        // If it's a "already exists" error, we can continue
        if (error.message.includes('already exists') || error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`   (Table/column already exists - marking as executed)`)
          await client.query(
            'INSERT INTO migrations (filename, executed_at) VALUES ($1, NOW()) ON CONFLICT (filename) DO NOTHING',
            [migrationFile]
          )
        } else {
          throw error
        }
      }
    }
    
    console.log('\\n✅ Missing migrations processing completed!')
    
  } catch (error) {
    console.error('❌ Migration process failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMissingMigrations().catch(console.error)