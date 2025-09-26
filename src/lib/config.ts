/**
 * Application configuration for production optimizations
 */

export const config = {
  // API Configuration
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3'),
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  },

  // Cache Configuration
  cache: {
    enabled: process.env.NODE_ENV === 'production',
    ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // File Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
  },

  // Security
  security: {
    cookieSecure: process.env.NODE_ENV === 'production',
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax' as 'lax' | 'strict' | 'none',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  },

  // Email
  email: {
    enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    timeout: 10000,
  },

  // Database
  database: {
    poolSize: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  },

  // Monitoring
  monitoring: {
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
    enableAPM: process.env.ENABLE_APM === 'true',
  },

  // Feature Flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS !== 'false',
    newsletter: process.env.ENABLE_NEWSLETTER !== 'false',
    blog: process.env.ENABLE_BLOG !== 'false',
    bulkOperations: process.env.ENABLE_BULK_OPERATIONS !== 'false',
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100'),
  },
}

export default config