import { Pool } from 'pg'

// For development/testing with self-signed certificates
if (process.env.NODE_ENV === 'development' || 
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('aivencloud.com'))) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

let pool: Pool

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    
    // For cloud databases like Aiven and other SSL-required databases, 
    // we need SSL but with relaxed certificate verification to handle self-signed certs
    const requiresSSL = connectionString.includes('aivencloud.com') || 
                       connectionString.includes('sslmode=require') ||
                       process.env.NODE_ENV === 'production'
    
    const sslConfig = requiresSSL 
      ? { 
          rejectUnauthorized: false, 
          checkServerIdentity: () => undefined,
          secureProtocol: 'TLSv1_2_method'
        } // Accept self-signed certificates
      : false
    
    console.log('Database connection config:', {
      hasConnectionString: !!connectionString,
      requiresSSL,
      sslConfig: sslConfig ? 'enabled with relaxed verification' : 'disabled'
    })
    
    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  
  return pool
}

export async function query(text: string, params?: any[]) {
  const db = getDb()
  const start = Date.now()
  
  try {
    const result = await db.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount })
    }
    
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getClient() {
  const db = getDb()
  return await db.connect()
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (pool) {
    pool.end()
  }
})

process.on('SIGTERM', () => {
  if (pool) {
    pool.end()
  }
})
