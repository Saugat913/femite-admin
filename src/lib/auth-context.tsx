'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  userId: string
  role: string
  issuedAt: string
  expires: string
  sessionId: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  checkSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()

  // Check session status
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.authenticated) {
          setUser(data.session)
          setIsAuthenticated(true)
          
          // Show notification if session was refreshed
          if (data.sessionRefreshed) {
            console.log('Session automatically refreshed')
          }
          
          return true
        }
      }
      
      // Session invalid or expired
      setUser(null)
      setIsAuthenticated(false)
      return false
      
    } catch (error) {
      console.error('Session check failed:', error)
      setUser(null)
      setIsAuthenticated(false)
      return false
    }
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Check session after successful login
        await checkSession()
        return { success: true }
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [checkSession])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }, [router])

  // Refresh session function
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'refresh' }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await checkSession() // Update local session data
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Session refresh failed:', error)
      return false
    }
  }, [checkSession])

  // Check session on mount and periodically
  useEffect(() => {
    const initialSessionCheck = async () => {
      const isValid = await checkSession()
      setIsLoading(false)
      
      // Redirect to login if not authenticated and not on login page
      if (!isValid && pathname !== '/login') {
        router.push('/login')
      }
    }
    
    initialSessionCheck()
  }, [checkSession, pathname, router])

  // Set up periodic session checks
  useEffect(() => {
    if (!isAuthenticated) return

    // Check session every 5 minutes
    const interval = setInterval(() => {
      checkSession()
    }, 5 * 60 * 1000)

    // Check session before page unload
    const handleBeforeUnload = () => {
      checkSession()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isAuthenticated, checkSession])

  // Handle session expiration warnings
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const checkExpiration = () => {
      const expiresAt = new Date(user.expires).getTime()
      const now = Date.now()
      const timeUntilExpiration = expiresAt - now
      const fifteenMinutes = 15 * 60 * 1000

      // Show warning when session expires in 15 minutes
      if (timeUntilExpiration > 0 && timeUntilExpiration < fifteenMinutes) {
        console.warn('Session expires in less than 15 minutes')
        // You could show a toast notification here
      }
    }

    // Check immediately
    checkExpiration()

    // Check every minute
    const interval = setInterval(checkExpiration, 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
    checkSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null // Will redirect to login
    }

    return <WrappedComponent {...props} />
  }
}