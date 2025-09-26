import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * Health check endpoint for monitoring and load balancers
 * GET /api/health
 */
export async function GET() {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const dbResult = await query('SELECT 1 as health_check')
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
    
    // Get deployment info if available
    let deploymentInfo = null
    try {
      const fs = require('fs')
      const path = require('path')
      const infoPath = path.join(process.cwd(), 'deployment-info.json')
      
      if (fs.existsSync(infoPath)) {
        deploymentInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
      }
    } catch (error) {
      // Deployment info is optional
    }
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${dbTime}ms`
        },
        environment: {
          status: missingEnvVars.length === 0 ? 'healthy' : 'warning',
          missingVariables: missingEnvVars.length > 0 ? missingEnvVars : undefined
        }
      },
      deployment: deploymentInfo
    }
    
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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