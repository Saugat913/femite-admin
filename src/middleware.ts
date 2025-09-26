import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const key = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

// Protected API routes that require admin authentication
const protectedApiRoutes = [
  '/api/admin',
  '/api/products',
  '/api/orders',
  '/api/users',
  '/api/categories',
  '/api/analytics',
  '/api/newsletter',
  '/api/settings',
]

// Protected pages that require admin authentication  
const protectedPages = [
  '/dashboard',
  '/products',
  '/orders',
  '/users',
  '/categories', 
  '/analytics',
  '/newsletter',
  '/settings',
  '/inventory',
  '/blog',
]

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth/login',
]

async function verifyAdminSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    })

    // Check if session has custom expires field and validate it
    if (payload.expires) {
      const expiresDate = new Date(payload.expires as string)
      if (expiresDate <= new Date()) {
        return null // Session expired
      }
    }

    // Verify admin role
    if (payload.role !== 'admin') {
      return null // Not an admin user
    }

    return payload
  } catch (error) {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route requires admin protection
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  )
  const isProtectedPage = protectedPages.some(page => 
    pathname.startsWith(page)
  )

  // Redirect root to dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isProtectedApiRoute || isProtectedPage) {
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie) {
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { 
            error: 'Admin authentication required',
            code: 'ADMIN_AUTH_REQUIRED' 
          }, 
          { status: 401 }
        )
      } else {
        // Redirect to login for protected pages
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Verify the admin session
    const session = await verifyAdminSession(sessionCookie.value)
    
    if (!session) {
      // Clear invalid session cookie
      const response = isProtectedApiRoute 
        ? NextResponse.json(
            { 
              error: 'Invalid admin session or insufficient permissions',
              code: 'INVALID_ADMIN_SESSION' 
            }, 
            { status: 401 }
          )
        : NextResponse.redirect(new URL('/login', request.url))
      
      // Clear the invalid session cookie
      response.cookies.set('session', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
      
      return response
    }

    // Add admin user info to request headers for API routes
    if (isProtectedApiRoute) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-admin-user-id', session.userId as string)
      requestHeaders.set('x-admin-user-role', session.role as string)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}