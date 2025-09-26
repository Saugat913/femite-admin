import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbo pack configuration for development
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Image optimization
  images: {
    // Add your production domains
    domains: [
      'localhost',
      'res.cloudinary.com', // Cloudinary images
      'admin.femite.com',
      'femite.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Don't expose sensitive environment variables to the client
  // Remove DATABASE_URL and JWT_SECRET from env
  
  // Production optimizations
  output: 'standalone', // Enable for Docker deployment
  poweredByHeader: false, // Remove "X-Powered-By: Next.js" header
  trailingSlash: false,
  compress: true,
  
  // Build optimization
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
  
  // Content Security Policy
  async rewrites() {
    return [
      // Add any URL rewrites here if needed
    ];
  },
};

export default nextConfig;
