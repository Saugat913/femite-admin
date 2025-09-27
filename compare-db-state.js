#!/usr/bin/env node

// For development/testing with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function compareDatabaseState() {
  console.log('Comparing database state with available migrations...')
  
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
    // Get executed migrations
    const executedMigrations = new Set()
    try {
      const migrationsResult = await client.query('SELECT filename FROM migrations ORDER BY executed_at')
      migrationsResult.rows.forEach(row => {
        executedMigrations.add(row.filename)
      })
    } catch (error) {
      console.log('Migrations table does not exist')
    }
    
    // Check available migrations in both projects
    const femiteMigrations = fs.readdirSync('/home/x/Projects/femite/migrations')
      .filter(file => file.endsWith('.sql'))
    
    const adminMigrations = fs.readdirSync('/home/x/Projects/femite-admin/migrations')
      .filter(file => file.endsWith('.sql'))
    
    console.log('\n=== MIGRATION COMPARISON ===')
    console.log('Executed migrations:', Array.from(executedMigrations).sort())
    
    console.log('\nFemite migrations:', femiteMigrations.sort())
    console.log('\nAdmin migrations:', adminMigrations.sort())
    
    // Find migrations not executed
    const allMigrations = new Set([...femiteMigrations, ...adminMigrations])
    const notExecuted = Array.from(allMigrations).filter(m => !executedMigrations.has(m))
    
    console.log('\n=== MISSING MIGRATIONS ===')
    if (notExecuted.length === 0) {
      console.log('All migrations have been executed')
    } else {
      notExecuted.forEach(migration => {
        const inFemite = femiteMigrations.includes(migration)
        const inAdmin = adminMigrations.includes(migration)
        console.log(`${migration} - ${inFemite ? 'femite' : ''}${inFemite && inAdmin ? '+' : ''}${inAdmin ? 'admin' : ''}`)
      })
    }
    
    // Check specific tables
    console.log('\n=== TABLE CHECKS ===')
    
    // Check if settings table exists
    try {
      const settingsResult = await client.query('SELECT COUNT(*) FROM settings')
      console.log(`Settings table: EXISTS (${settingsResult.rows[0].count} rows)`)
    } catch (error) {
      console.log('Settings table: MISSING')
    }
    
    // Check refresh_tokens table
    try {
      const refreshResult = await client.query('SELECT COUNT(*) FROM refresh_tokens')
      console.log(`Refresh tokens table: EXISTS (${refreshResult.rows[0].count} rows)`)
    } catch (error) {
      console.log('Refresh tokens table: MISSING')
    }
    
    // Check products table for Cloudinary fields
    try {
      const cloudinaryResult = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name LIKE '%cloudinary%'
      `)
      if (cloudinaryResult.rows.length > 0) {
        console.log('Cloudinary fields in products: EXISTS', cloudinaryResult.rows.map(r => r.column_name))
      } else {
        console.log('Cloudinary fields in products: MISSING')
      }
    } catch (error) {
      console.log('Could not check Cloudinary fields')
    }
    
  } catch (error) {
    console.error('Error checking database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// Load environment variables from femite-admin
require('dotenv').config({ path: '/home/x/Projects/femite-admin/.env.local' })

// Check database
compareDatabaseState()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })