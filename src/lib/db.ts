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
    
    // Serverless-optimized pool configuration
    const poolConfig = {
      connectionString,
      ssl: sslConfig,
      // Serverless optimization: smaller pool size
      max: process.env.NODE_ENV === 'production' && process.env.VERCEL 
        ? parseInt(process.env.DB_POOL_SIZE || '3') // Very small pool for serverless
        : parseInt(process.env.DB_POOL_SIZE || '10'),
      
      // Shorter timeouts for serverless
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      
      // Aggressive connection management for serverless
      allowExitOnIdle: process.env.VERCEL === '1',
    }
    
    pool = new Pool(poolConfig)
  }
  
  return pool
}

export async function query(text: string, params?: any[]) {
  const db = getDb()
  const start = Date.now()
  
  // Reduced retries for serverless environment
  const maxRetries = process.env.VERCEL === '1' ? 2 : 3
  let retries = maxRetries
  
  while (retries > 0) {
    let client
    try {
      // For serverless: get a dedicated client for better connection management
      if (process.env.VERCEL === '1') {
        client = await db.connect()
        const result = await client.query(text, params)
        const duration = Date.now() - start
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Executed query', { text: text.substring(0, 100) + '...', duration, rows: result.rowCount })
        }
        
        return result
      } else {
        // For non-serverless: use pool directly
        const result = await db.query(text, params)
        const duration = Date.now() - start
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Executed query', { text: text.substring(0, 100) + '...', duration, rows: result.rowCount })
        }
        
        return result
      }
    } catch (error: any) {
      retries--
      console.error(`Database query error (${maxRetries - retries}/${maxRetries} attempts):`, {
        error: error.message,
        code: error.code,
        retries
      })
      
      if (retries === 0 || !shouldRetry(error)) {
        throw error
      }
      
      // Shorter wait times for serverless
      const waitTime = process.env.VERCEL === '1' ? 500 * (maxRetries - retries) : 1000 * (maxRetries - retries)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    } finally {
      // Always release client in serverless environment
      if (client && process.env.VERCEL === '1') {
        client.release()
      }
    }
  }
}

// Determine if an error should trigger a retry
function shouldRetry(error: any): boolean {
  const retryableCodes = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    '57P01', // PostgreSQL admin shutdown
    '53300', // Too many connections
  ]
  
  return retryableCodes.includes(error.code) || 
         error.message?.includes('timeout') ||
         error.message?.includes('connection')
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
