#!/usr/bin/env node

const fs = require('fs')
const { Pool } = require('pg')

// For development/testing with self-signed certificates  
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function checkIntegrationSetup() {
  console.log('🔍 Checking Integration Setup...\n')

  // Load environment variables from both projects
  const femiteEnvPath = './femite/.env.local'
  const adminEnvPath = './femite-admin/.env.local'

  let femiteEnv = {}
  let adminEnv = {}

  try {
    if (fs.existsSync(femiteEnvPath)) {
      const femiteEnvContent = fs.readFileSync(femiteEnvPath, 'utf8')
      femiteEnvContent.split('\n').forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, value] = line.split('=')
          femiteEnv[key.trim()] = value.trim()
        }
      })
      console.log('✅ Femite .env.local loaded')
    } else {
      console.log('❌ Femite .env.local not found')
      return
    }

    if (fs.existsSync(adminEnvPath)) {
      const adminEnvContent = fs.readFileSync(adminEnvPath, 'utf8')
      adminEnvContent.split('\n').forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, value] = line.split('=')
          adminEnv[key.trim()] = value.trim()
        }
      })
      console.log('✅ Admin .env.local loaded')
    } else {
      console.log('❌ Admin .env.local not found')
      return
    }
  } catch (error) {
    console.log('❌ Error reading env files:', error.message)
    return
  }

  console.log('\n=== DATABASE CONFIGURATION ===')
  const femiteDbUrl = femiteEnv.DATABASE_URL
  const adminDbUrl = adminEnv.DATABASE_URL

  if (!femiteDbUrl) {
    console.log('❌ Femite DATABASE_URL not set')
  } else if (!adminDbUrl) {
    console.log('❌ Admin DATABASE_URL not set')
  } else if (femiteDbUrl === adminDbUrl) {
    console.log('✅ Both projects use the same database')
    
    // Test database connection
    try {
      const pool = new Pool({
        connectionString: adminDbUrl,
        ssl: adminDbUrl.includes('aivencloud') || adminDbUrl.includes('sslmode=require') 
          ? { rejectUnauthorized: false, checkServerIdentity: false }
          : false
      })

      const client = await pool.connect()
      console.log('✅ Database connection successful')

      // Quick count check
      const result = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM products) as products,
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM blog_posts) as blog_posts,
          (SELECT COUNT(*) FROM settings) as settings
      `)
      
      const counts = result.rows[0]
      console.log(`   Products: ${counts.products}`)
      console.log(`   Users: ${counts.users}`) 
      console.log(`   Blog Posts: ${counts.blog_posts}`)
      console.log(`   Settings: ${counts.settings}`)

      client.release()
      await pool.end()
    } catch (error) {
      console.log('❌ Database connection failed:', error.message)
    }
  } else {
    console.log('⚠️  WARNING: Projects use different databases')
    console.log(`   Femite: ${femiteDbUrl.substring(0, 50)}...`)
    console.log(`   Admin:  ${adminDbUrl.substring(0, 50)}...`)
  }

  console.log('\n=== REVALIDATION CONFIGURATION ===')
  const clientSiteUrl = adminEnv.CLIENT_SITE_URL
  const adminRevalidationSecret = adminEnv.CLIENT_SITE_REVALIDATION_SECRET
  const femiteRevalidationSecret = femiteEnv.REVALIDATION_SECRET

  if (!clientSiteUrl) {
    console.log('❌ CLIENT_SITE_URL not set in admin')
  } else {
    console.log(`✅ Client site URL: ${clientSiteUrl}`)
  }

  if (!adminRevalidationSecret) {
    console.log('❌ CLIENT_SITE_REVALIDATION_SECRET not set in admin')
  } else if (!femiteRevalidationSecret) {
    console.log('❌ REVALIDATION_SECRET not set in femite')
  } else if (adminRevalidationSecret === femiteRevalidationSecret) {
    console.log('✅ Revalidation secrets match')
  } else {
    console.log('⚠️  WARNING: Revalidation secrets do not match')
  }

  console.log('\n=== PORT CONFIGURATION ===')
  // Check if ports are available
  const checkPort = (port) => {
    return new Promise((resolve) => {
      const net = require('net')
      const server = net.createServer()
      
      server.listen(port, (err) => {
        if (err) {
          resolve(false)
        } else {
          server.once('close', () => resolve(true))
          server.close()
        }
      })
      
      server.on('error', () => resolve(false))
    })
  }

  const port3000Available = await checkPort(3000)
  const port3001Available = await checkPort(3001)

  console.log(`Port 3000 (Femite): ${port3000Available ? '✅ Available' : '❌ In use'}`)
  console.log(`Port 3001 (Admin): ${port3001Available ? '✅ Available' : '❌ In use'}`)

  console.log('\n=== SUMMARY ===')
  const allGood = femiteDbUrl && adminDbUrl && femiteDbUrl === adminDbUrl && 
                  adminRevalidationSecret && femiteRevalidationSecret && 
                  adminRevalidationSecret === femiteRevalidationSecret &&
                  port3000Available && port3001Available

  if (allGood) {
    console.log('🎉 All checks passed! Ready to start both projects.')
    console.log('\nRun: ./start-both-projects.sh')
  } else {
    console.log('⚠️  Some issues found. Please fix them before starting.')
    console.log('\nCommon fixes:')
    console.log('1. Make sure DATABASE_URL is the same in both .env.local files')
    console.log('2. Set matching REVALIDATION_SECRET values')
    console.log('3. Ensure ports 3000 and 3001 are available')
  }
}

checkIntegrationSetup().catch(console.error)