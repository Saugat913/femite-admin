# Femite Admin Panel - Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Femite Admin Panel to Vercel.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed locally
- [Git](https://git-scm.com/) installed
- A Vercel account ([sign up here](https://vercel.com/signup))
- A PostgreSQL database (see [Database Setup](#database-setup))
- Cloudinary account for image uploads

## Quick Start

1. **Run the pre-deployment check:**
   ```bash
   npm run vercel-check
   ```

2. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Configure environment variables** in the Vercel dashboard

## Detailed Setup Guide

### 1. Database Setup

You'll need a PostgreSQL database. We recommend these managed services for production:

#### Option A: Vercel Postgres (Recommended)
```bash
# Install Vercel Storage
npm i @vercel/postgres

# Create database via Vercel CLI
vercel env add DATABASE_URL
```

#### Option B: Neon (Free tier available)
1. Go to [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string

#### Option C: Supabase
1. Go to [supabase.com](https://supabase.com/)
2. Create a new project
3. Get the direct connection URL (not the pooled one)

#### Option D: PlanetScale
1. Go to [planetscale.com](https://planetscale.com/)
2. Create a new database
3. Generate a connection string

### 2. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from the dashboard
3. These will be used in environment variables

### 3. Email Configuration

For production emails, set up SMTP credentials:

#### Gmail (Recommended for development)
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use `smtp.gmail.com:587` as SMTP settings

#### SendGrid (Recommended for production)
1. Sign up at [sendgrid.com](https://sendgrid.com/)
2. Create an API key
3. Use SendGrid SMTP settings

### 4. Environment Variables

Copy the variables from `.env.vercel` to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable from `.env.vercel`:

#### Required Variables
```env
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
NEXT_PUBLIC_APP_NAME="Femite Hemp Fashion Admin"
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
CLIENT_SITE_URL=https://your-main-site.com
CLIENT_SITE_REVALIDATION_SECRET=your-revalidation-secret
```

#### Optional Variables
```env
NODE_ENV=production
REVALIDATION_SECRET=your-isr-revalidation-secret
CACHE_DEFAULT_TTL=300
DB_POOL_SIZE=3
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=5000
BCRYPT_ROUNDS=12
ENABLE_ANALYTICS=true
ENABLE_NEWSLETTER=true
ENABLE_BLOG=true
LOG_LEVEL=error
```

### 5. Deploy to Vercel

#### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to your account
vercel login

# Deploy to production
vercel --prod

# Follow the prompts to configure your project
```

#### Method 2: GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Import the project in Vercel dashboard
4. Configure environment variables
5. Deploy

### 6. Database Migration

After deployment, initialize your database:

#### Option A: Use the setup script directly
```bash
# Connect to your deployed database
DATABASE_URL="your-production-db-url" node scripts/setup-database.js
```

#### Option B: Use a migration tool
Consider using [Prisma](https://prisma.io/) or [Drizzle](https://orm.drizzle.team/) for better migration management.

### 7. Verify Deployment

1. **Check health endpoint:**
   ```bash
   curl https://your-app-name.vercel.app/api/health
   ```

2. **Test admin login:**
   - Visit your deployed URL
   - Use the default admin credentials (change them immediately!)
   - Default: admin@hempfashion.com / admin123

## Configuration Details

### Vercel.json Configuration

The `vercel.json` file is configured for optimal performance:

- **Regions**: Deployed to `iad1` (US East) by default
- **Function Duration**: API routes have 30-second timeout
- **Node Version**: Uses Node.js 20.x
- **Build Command**: Runs type checking before build

### Next.js Configuration

Key optimizations for Vercel:

- **Image Optimization**: Configured for multiple domains
- **Security Headers**: CSP and security headers enabled
- **Webpack**: Custom SVG handling for icons

### Database Connection

Optimized for serverless:

- **Pool Size**: Limited to 3 connections on Vercel
- **Timeouts**: Aggressive timeouts for serverless functions
- **Connection Management**: Proper client release in serverless environment

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
Error: Database connection failed
```

**Solutions:**
- Verify `DATABASE_URL` is correct
- Ensure database allows SSL connections
- Check if database service is running
- Verify connection limits

#### 2. Build Failures
```bash
Error: Build failed
```

**Solutions:**
- Run `npm run vercel-check` locally
- Fix TypeScript errors: `npm run type-check`
- Ensure all dependencies are installed
- Check for syntax errors in configuration files

#### 3. Function Timeout
```bash
Error: Function execution timed out
```

**Solutions:**
- Optimize database queries
- Reduce API response payload
- Consider database query caching
- Check for infinite loops

#### 4. Environment Variable Issues
```bash
Error: Missing required environment variables
```

**Solutions:**
- Double-check all variables in Vercel dashboard
- Ensure sensitive variables are properly set
- Restart deployment after adding variables
- Check variable names for typos

### Performance Optimization

1. **Enable caching:**
   ```typescript
   // API routes automatically use serverless cache
   import { withCache } from '@/lib/serverless-cache'
   ```

2. **Optimize database queries:**
   - Use indexes for frequently queried fields
   - Limit result sets with pagination
   - Use connection pooling

3. **Image optimization:**
   - Use Next.js Image component
   - Cloudinary transformations
   - WebP format when possible

### Monitoring

1. **Health checks:**
   - Monitor `/api/health` endpoint
   - Set up uptime monitoring (e.g., Uptime Robot)

2. **Performance monitoring:**
   - Use Vercel Analytics
   - Monitor function execution times
   - Track database query performance

3. **Error tracking:**
   - Set up error monitoring (e.g., Sentry)
   - Monitor Vercel function logs

## Security Considerations

1. **Environment Variables:**
   - Use Vercel's encrypted environment variables for secrets
   - Never commit sensitive data to git
   - Rotate secrets regularly

2. **Database Security:**
   - Use SSL connections (enforced by configuration)
   - Limit database user permissions
   - Regular security updates

3. **API Security:**
   - JWT tokens are properly configured
   - Rate limiting is enabled
   - CORS is properly configured

## Backup and Recovery

1. **Database Backups:**
   - Enable automated backups on your database provider
   - Test restore procedures regularly
   - Consider cross-region backups for critical data

2. **Code Backups:**
   - Keep git repository updated
   - Use multiple git remotes if possible
   - Tag releases for easy rollback

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Run the pre-deployment check: `npm run vercel-check`
3. Check Vercel function logs in the dashboard
4. Review this guide for missed steps

## Next Steps

After successful deployment:

1. **Change default admin password**
2. **Set up monitoring and alerts**
3. **Configure domain name** (if not using vercel.app subdomain)
4. **Set up SSL certificate** (automatic with custom domains)
5. **Configure email notifications**
6. **Set up regular database backups**

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

**Last Updated:** 2024-12-30
**Version:** 1.0.0