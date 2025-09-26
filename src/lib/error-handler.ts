/**
 * Comprehensive error handling and validation utilities
 */

export interface ApiError {
  code: string
  message: string
  details?: string
  statusCode?: number
  timestamp: string
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    code: string = 'GENERAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly details?: string
  
  constructor(message: string, details?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.details = details
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429)
  }
}

/**
 * Input validation helpers
 */
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  },

  password: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  price: (price: number): boolean => {
    return typeof price === 'number' && price >= 0 && isFinite(price)
  },

  stock: (stock: number): boolean => {
    return typeof stock === 'number' && stock >= 0 && Number.isInteger(stock)
  },

  url: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  phoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  },

  postalCode: (code: string, country: string = 'US'): boolean => {
    const patterns = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    }
    
    const pattern = patterns[country as keyof typeof patterns] || patterns.US
    return pattern.test(code)
  },

  required: <T>(value: T, fieldName: string): T => {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`)
    }
    return value
  },

  minLength: (value: string, minLength: number, fieldName: string): string => {
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`)
    }
    return value
  },

  maxLength: (value: string, maxLength: number, fieldName: string): string => {
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters`)
    }
    return value
  },

  range: (value: number, min: number, max: number, fieldName: string): number => {
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`)
    }
    return value
  },
}

/**
 * Error formatting for API responses
 */
export const formatError = (error: unknown): ApiError => {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: (error as any).details,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
    }
  }

  if (error instanceof Error) {
    return {
      code: 'GENERAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  isAllowed(key: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this key
    const existingRequests = this.requests.get(key) || []

    // Filter out requests outside the window
    const validRequests = existingRequests.filter(time => time > windowStart)

    // Check if under limit
    if (validRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)

    return true
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key)
    } else {
      this.requests.clear()
    }
  }
}

/**
 * Async error handler wrapper
 */
export const asyncHandler = <Req = unknown, Res = unknown, Next = unknown>(
  fn: (req: Req, res: Res, next?: Next) => unknown | Promise<unknown>
) => {
  return (req: Req, res: Res, next?: Next) => {
    return Promise
      .resolve(fn(req, res, next))
      .catch(
        typeof next === 'function'
          ? (next as unknown as (err: unknown) => void)
          : (error: unknown) => {
              console.error('Async handler error:', error)
              throw error
            }
      )
  }
}

/**
 * Database error parser
 */
export const parseDbError = (error: any): AppError => {
  if (error.code === '23505') {
    // Unique constraint violation
    const detail = error.detail || ''
    if (detail.includes('email')) {
      return new ConflictError('Email address is already registered')
    }
    if (detail.includes('slug')) {
      return new ConflictError('URL slug is already in use')
    }
    return new ConflictError('This record already exists')
  }

  if (error.code === '23503') {
    // Foreign key constraint violation
    return new ValidationError('Referenced record does not exist')
  }

  if (error.code === '23502') {
    // Not null constraint violation
    const column = error.column || 'field'
    return new ValidationError(`${column} is required`)
  }

  if (error.code === '42703') {
    // Undefined column
    return new AppError('Database schema error', 'SCHEMA_ERROR', 500)
  }

  // Generic database error
  return new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'Database operation failed' 
      : error.message,
    'DATABASE_ERROR',
    500
  )
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  validators,
  formatError,
  RateLimiter,
  asyncHandler,
  parseDbError,
}