import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { serverlessCache } from '@/lib/serverless-cache'

/**
 * Health check endpoint for monitoring and load balancers
 * Optimized for serverless deployment with caching
 * GET /api/health
 */
export async function GET() {
  try {
    const startTime = Date.now()
    
    // For Vercel: Use cached health status to avoid unnecessary DB queries
    const cacheKey = 'health-check'
    const cacheTTL = 30000 // 30 seconds
    
    if (process.env.VERCEL === '1') {
      const cachedHealth = serverlessCache.get(cacheKey)
      if (cachedHealth) {
        return NextResponse.json({
          ...cachedHealth,
          cached: true,
          timestamp: new Date().toISOString()
        }, {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=30',
            'X-Cache': 'HIT'
          }
        })
      }
    }
    
    // Check database connectivity with timeout
    const dbCheckPromise = query('SELECT 1 as health_check')
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    )
    
    const dbResult = await Promise.race([dbCheckPromise, timeoutPromise]) as any
    const dbTime = Date.now() - startTime
    
    if (!dbResult || dbResult.rows.length === 0) {
      throw new Error('Database health check failed')
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXT_PUBLIC_APP_URL'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      console.warn('Missing environment variables:', missingEnvVars)
    }
    
    // Get Vercel deployment info from environment
    const deploymentInfo = process.env.VERCEL === '1' ? {
      vercel: true,
      region: process.env.VERCEL_REGION || process.env.AWS_REGION,
      url: process.env.VERCEL_URL,
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF
    } : null
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      serverless: process.env.VERCEL === '1',
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${dbTime}ms`
        },
        environment: {
          status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
          missingVariables: missingEnvVars.length > 0 ? missingEnvVars : undefined
        },
        cache: process.env.VERCEL === '1' ? {
          status: 'healthy',
          stats: serverlessCache.getStats()
        } : undefined
      },
      deployment: deploymentInfo
    }
    
    // Cache the result for serverless environments
    if (process.env.VERCEL === '1') {
      serverlessCache.set(cacheKey, healthData, cacheTTL)
    }
    
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': process.env.VERCEL === '1' 
          ? 'public, max-age=30, stale-while-revalidate=60'
          : 'no-cache, no-store, must-revalidate',
        'X-Cache': 'MISS'
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}