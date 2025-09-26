'use client'

import { useState, useEffect } from 'react'
import { X, Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface SessionNotificationProps {
  className?: string
}

export default function SessionNotification({ className = '' }: SessionNotificationProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeUntilExpiration, setTimeUntilExpiration] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { user, refreshSession, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShowWarning(false)
      return
    }

    const checkExpiration = () => {
      const expiresAt = new Date(user.expires).getTime()
      const now = Date.now()
      const timeLeft = expiresAt - now
      const fifteenMinutes = 15 * 60 * 1000

      setTimeUntilExpiration(timeLeft)

      // Show warning when session expires in 15 minutes
      if (timeLeft > 0 && timeLeft < fifteenMinutes) {
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
    }

    // Check immediately
    checkExpiration()

    // Check every 30 seconds
    const interval = setInterval(checkExpiration, 30 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      const success = await refreshSession()
      if (success) {
        setShowWarning(false)
        // You could show a success toast here
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (60 * 1000))
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!showWarning) return null

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Your session will expire in {formatTimeRemaining(timeUntilExpiration)}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                type="button"
                onClick={handleRefreshSession}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Extend Session
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}