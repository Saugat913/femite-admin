import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { 
  SessionErrorBuilder, 
  SessionValidator, 
  SessionValidationResult,
  SessionErrorCode 
} from './session-errors'

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  
  if (!session) return null
  
  try {
    const payload = await decrypt(session)
    
    // Check if session has custom expires field and validate it
    if (payload.expires) {
      const expiresDate = new Date(payload.expires as string)
      if (expiresDate <= new Date()) {
        // Session has expired, delete the cookie
        await deleteSession()
        return null
      }
    }
    
    return payload
  } catch (error) {
    console.error('Session validation error:', error)
    // Clear invalid session cookie
    await deleteSession()
    return null
  }
}

// Enhanced session validation with detailed error reporting
export async function validateSession(): Promise<SessionValidationResult> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) {
    return SessionValidator.failure(SessionErrorBuilder.missing())
  }
  
  try {
    const payload = await decrypt(sessionCookie)
    
    if (!payload || !payload.userId) {
      await deleteSession()
      return SessionValidator.failure(SessionErrorBuilder.malformed())
    }
    
    // Check if session has custom expires field and validate it
    if (payload.expires) {
      const expiresDate = new Date(payload.expires as string)
      if (expiresDate <= new Date()) {
        await deleteSession()
        return SessionValidator.failure(SessionErrorBuilder.expired())
      }
    }
    
    return SessionValidator.success(payload)
  } catch (error) {
    console.error('Session validation error:', error)
    await deleteSession()
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return SessionValidator.failure(SessionErrorBuilder.expired())
      }
      if (error.message.includes('invalid')) {
        return SessionValidator.failure(SessionErrorBuilder.invalid())
      }
    }
    
    return SessionValidator.failure(SessionErrorBuilder.malformed())
  }
}

export async function createSession(userId: string, role: string, sessionId?: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  const currentSessionId = sessionId || generateSessionId()
  
  const session = await encrypt({ 
    userId, 
    role, 
    expires, 
    sessionId: currentSessionId,
    issuedAt: new Date().toISOString()
  })
  
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Better compatibility for production
    path: '/',
  })
  
  // Set CSRF token cookie
  const csrfToken = generateSessionId()
  cookieStore.set('csrf-token', csrfToken, {
    expires,
    httpOnly: false, // Needs to be readable by frontend
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  
  return { sessionId: currentSessionId, csrfToken }
}

// Refresh session if it's close to expiration
export async function refreshSessionIfNeeded(): Promise<boolean> {
  const validation = await validateSession()
  
  if (!validation.success || !validation.session) {
    return false
  }
  
  const session = validation.session
  const expiresDate = new Date(session.expires as string)
  const now = new Date()
  const timeUntilExpiration = expiresDate.getTime() - now.getTime()
  const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds
  
  // Refresh if session expires within the next hour
  if (timeUntilExpiration < oneHour) {
    try {
      await createSession(session.userId as string, session.role as string)
      return true
    } catch (error) {
      console.error('Session refresh failed:', error)
      return false
    }
  }
  
  return false // No refresh needed
}

// Check if session is close to expiration
export async function isSessionNearExpiration(): Promise<boolean> {
  const validation = await validateSession()
  
  if (!validation.success || !validation.session) {
    return true // Consider expired/invalid sessions as "near expiration"
  }
  
  const session = validation.session
  const expiresDate = new Date(session.expires as string)
  const now = new Date()
  const timeUntilExpiration = expiresDate.getTime() - now.getTime()
  const twoHours = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
  
  return timeUntilExpiration < twoHours
}

export async function deleteSession() {
  const cookieStore = await cookies()
  
  // Clear session cookie
  cookieStore.set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  
  // Clear CSRF token cookie
  cookieStore.set('csrf-token', '', {
    expires: new Date(0),
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate secure session ID
export function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

// Validate CSRF token
export async function validateCSRFToken(requestToken: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedToken = cookieStore.get('csrf-token')?.value
  
  if (!storedToken || !requestToken) {
    return false
  }
  
  // Use constant-time comparison to prevent timing attacks
  return timeSafeEqual(storedToken, requestToken)
}

// Constant-time string comparison
function timeSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

// Session rotation for enhanced security
export async function rotateSession(): Promise<boolean> {
  const validation = await validateSession()
  
  if (!validation.success || !validation.session) {
    return false
  }
  
  try {
    // Create new session with same user data but new session ID
    const newSessionData = await createSession(
      validation.session.userId as string, 
      validation.session.role as string
    )
    return true
  } catch (error) {
    console.error('Session rotation failed:', error)
    return false
  }
}
