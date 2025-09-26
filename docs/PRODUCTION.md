# Hemp Admin Panel - Production Deployment Guide

This document provides comprehensive instructions for deploying the Hemp Admin Panel to production.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- SSL certificates (for HTTPS)
- Domain name configured

### Basic Deployment

1. **Clone and setup**
   ```bash
   git clone <your-repo-url> hemp-admin
   cd hemp-admin
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

3. **Deploy**
   ```bash
   ./scripts/deploy.sh
   npm run start:prod
   ```

## 📋 Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/hemp_admin?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Application URLs
NEXT_PUBLIC_APP_URL=https://admin.femite.com
REVALIDATION_SECRET=your-revalidation-secret
```

### Optional but Recommended

```bash
# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Performance
NODE_ENV=production
DB_POOL_SIZE=20
RATE_LIMIT_MAX_REQUESTS=100
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Manual Docker Build

```bash
# Build image
docker build -t hemp-admin .

# Run container
docker run -d \
  --name hemp-admin \
  -p 3000:3000 \
  --env-file .env \
  hemp-admin
```

## 🏗️ Manual Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install nginx (optional, for reverse proxy)
sudo apt install nginx
```

### 2. Database Setup

```bash
# Create database
sudo -u postgres createdb hemp_admin
sudo -u postgres createuser admin_user

# Set password
sudo -u postgres psql
ALTER USER admin_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE hemp_admin TO admin_user;
\q

# Run migrations
psql $DATABASE_URL -f migrations/001_initial.sql
# Continue with other migration files...
```

### 3. Application Deployment

```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build:prod

# Start with PM2 (recommended)
npm install -g pm2
pm2 start npm --name "hemp-admin" -- run start:prod
pm2 startup
pm2 save
```

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d admin.femite.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Setup

```bash
# Create SSL directory
mkdir -p ssl

# Add your certificate files
# ssl/cert.pem (certificate)
# ssl/key.pem (private key)
```

## 🔧 Nginx Configuration

Create `/etc/nginx/sites-available/hemp-admin`:

```nginx
server {
    listen 80;
    server_name admin.femite.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.femite.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets
    location /_next/static {
        alias /path/to/hemp-admin/.next/static;
        expires 1y;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/hemp-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoring

### Health Check

```bash
# Test health endpoint
curl https://admin.femite.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": {"status": "healthy"},
    "environment": {"status": "healthy"}
  }
}
```

### Log Monitoring

```bash
# View application logs
tail -f logs/app.log

# Monitor with PM2
pm2 logs hemp-admin

# Monitor database
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Performance Monitoring

Consider setting up:
- **Uptime monitoring**: Pingdom, UptimeRobot
- **Error tracking**: Sentry
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: ELK stack, Splunk

## 🔐 Security Checklist

- [ ] Strong database passwords
- [ ] JWT secret is cryptographically secure (64+ chars)
- [ ] SSL/TLS enabled with strong ciphers
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Regular security updates applied
- [ ] Database backups configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] File upload restrictions in place
- [ ] Environment variables secured
- [ ] Database connection uses SSL
- [ ] Admin access restricted by IP (if applicable)

## 🔄 Backup & Recovery

### Database Backup

```bash
# Create backup script
#!/bin/bash
BACKUP_FILE="hemp_admin_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > backups/$BACKUP_FILE
gzip backups/$BACKUP_FILE

# Keep only 30 days of backups
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

### Automated Backups

```bash
# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### Recovery

```bash
# Restore from backup
gunzip backup_file.sql.gz
psql $DATABASE_URL < backup_file.sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database is running
   - Check firewall/security groups

2. **502 Bad Gateway**
   - Application not running
   - Wrong port in nginx config
   - Check application logs

3. **SSL Certificate Issues**
   - Verify certificate files
   - Check certificate expiry
   - Restart nginx after certificate updates

4. **High Memory Usage**
   - Check for memory leaks
   - Increase server resources
   - Enable swap if needed

### Performance Optimization

1. **Database**
   - Add indexes to frequently queried columns
   - Regular VACUUM and ANALYZE
   - Monitor slow queries

2. **Application**
   - Enable gzip compression
   - Set up CDN for static assets
   - Implement Redis caching

3. **Server**
   - Monitor CPU/Memory usage
   - Set up log rotation
   - Regular system updates

## 📞 Support

For deployment issues or questions:
- Check application logs first
- Review this documentation
- Check the health endpoint
- Verify environment configuration

## 🔄 Updates

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm ci --only=production

# Run new migrations (if any)
# Check migrations/ directory for new files

# Rebuild and restart
npm run build:prod
pm2 restart hemp-admin
```

### Zero-Downtime Updates

```bash
# Using PM2
pm2 reload hemp-admin

# Using Docker
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```