import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './db'

export interface User {
  id: string
  email: string
  role: 'admin' | 'client'
  created_at: string
  email_verified?: boolean
}

export interface AuthToken {
  id: string
  email: string
  role: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

export class AuthService {
  // Generate JWT token
  static generateToken(payload: AuthToken): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'hemp-admin',
      audience: 'hemp-admin-users'
    })
  }

  // Verify JWT token
  static verifyToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'hemp-admin',
        audience: 'hemp-admin-users'
      }) as AuthToken
      return decoded
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS)
  }

  // Compare password
  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Authenticate user
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    try {
      // Find user by email
      const result = await query(
        'SELECT id, email, password_hash, role, created_at, email_verified FROM users WHERE email = $1 AND role = $2',
        [email, 'admin']
      )

      if (result.rows.length === 0) {
        return null
      }

      const user = result.rows[0]
      
      // Verify password
      const isValidPassword = await this.comparePassword(password, user.password_hash)
      if (!isValidPassword) {
        return null
      }

      // Return user without password
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        email_verified: user.email_verified
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT id, email, role, created_at, email_verified FROM users WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }

  // Create admin user (for setup)
  static async createAdminUser(email: string, password: string): Promise<User | null> {
    try {
      // Check if admin already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists')
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password)

      // Create user
      const result = await query(
        'INSERT INTO users (id, email, password_hash, role, created_at, email_verified) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), true) RETURNING id, email, role, created_at, email_verified',
        [email, hashedPassword, 'admin']
      )

      return result.rows[0]
    } catch (error) {
      console.error('Create admin user error:', error)
      return null
    }
  }

  // Update user password
  static async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await this.hashPassword(newPassword)
      
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, userId]
      )

      return true
    } catch (error) {
      console.error('Update password error:', error)
      return false
    }
  }

  // Check if user is admin
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      )

      return result.rows.length > 0 && result.rows[0].role === 'admin'
    } catch (error) {
      console.error('Admin check error:', error)
      return false
    }
  }

  // Log authentication attempt
  static async logAuthAttempt(email: string, success: boolean, ip?: string): Promise<void> {
    try {
      // You can create an auth_logs table for security auditing
      console.log('Auth attempt:', { email, success, ip, timestamp: new Date().toISOString() })
    } catch (error) {
      console.error('Log auth attempt error:', error)
    }
  }

  // Generate refresh token (for long-term sessions)
  static generateRefreshToken(payload: AuthToken): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'hemp-admin',
      audience: 'hemp-admin-refresh'
    })
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'hemp-admin',
        audience: 'hemp-admin-refresh'
      }) as AuthToken
      return decoded
    } catch (error) {
      console.error('Refresh token verification failed:', error)
      return null
    }
  }
}

export default AuthService