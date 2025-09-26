# Environment Variables Documentation

This document explains all environment variables used in the Hemp Fashion Admin Panel.

## Overview

The admin panel uses environment variables for configuration. Copy `.env.example` to `.env.local` and update the values for your environment.

## Required Variables

### Database Configuration

#### `DATABASE_URL`
- **Required**: Yes
- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://username:password@host:port/database?sslmode=require`
- **Example**: `postgresql://admin:password123@localhost:5432/hemp_admin`
- **Notes**: 
  - Must use the same database as the main ecommerce site
  - Include `?sslmode=require` for production
  - Ensure the database user has full read/write permissions

### Authentication

#### `JWT_SECRET`
- **Required**: Yes  
- **Description**: Secret key for signing JWT tokens
- **Format**: Minimum 32 characters, random string
- **Generate**: `openssl rand -base64 64`
- **Example**: `hemp-admin-super-secure-jwt-secret-key-2025`
- **Security**: Keep this secret! Anyone with this key can generate valid admin tokens

### Application URLs

#### `NEXT_PUBLIC_APP_NAME`
- **Required**: Yes
- **Description**: Name displayed in the admin panel
- **Example**: `"Femite Hemp Fashion Admin"`

#### `NEXT_PUBLIC_APP_URL`
- **Required**: Yes
- **Description**: URL where the admin panel is hosted
- **Development**: `http://localhost:3001`
- **Production**: `https://admin.yourdomain.com`

### Ecommerce Site Integration

#### `CLIENT_SITE_URL`
- **Required**: Yes
- **Description**: URL of the main ecommerce website
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Purpose**: Used for cache revalidation and redirects

#### `CLIENT_SITE_REVALIDATION_SECRET`
- **Required**: Yes
- **Description**: Secret key for triggering cache revalidation on the main site
- **Format**: Random string, minimum 32 characters
- **Example**: `hemp-revalidation-secret-2025`
- **Note**: Must match the `REVALIDATION_SECRET` in the main site's environment

### Email Configuration

#### `SMTP_HOST`
- **Required**: Yes
- **Description**: SMTP server hostname
- **Gmail**: `smtp.gmail.com`
- **Outlook**: `smtp.live.com`
- **Other**: Contact your email provider

#### `SMTP_PORT`
- **Required**: Yes
- **Description**: SMTP server port
- **Standard**: `587` (TLS) or `465` (SSL)
- **Gmail**: `587`

#### `SMTP_USER`
- **Required**: Yes
- **Description**: Email address for sending emails
- **Example**: `admin@yourdomain.com`

#### `SMTP_PASSWORD`
- **Required**: Yes
- **Description**: Password or app password for email account
- **Gmail**: Use [App Passwords](https://support.google.com/accounts/answer/185833)
- **Security**: Never use your regular password, always use app passwords

#### `ADMIN_EMAIL`
- **Required**: Yes
- **Description**: Email address for admin notifications
- **Example**: `admin@yourdomain.com`
- **Purpose**: Receives order notifications, system alerts, etc.

### Image Upload (Cloudinary)

#### `CLOUDINARY_CLOUD_NAME`
- **Required**: Yes
- **Description**: Your Cloudinary cloud name
- **Get from**: [Cloudinary Dashboard](https://cloudinary.com/console)
- **Example**: `hemp-fashion-cloud`

#### `CLOUDINARY_API_KEY`
- **Required**: Yes
- **Description**: Cloudinary API key
- **Get from**: [Cloudinary Dashboard](https://cloudinary.com/console)
- **Format**: Numeric string

#### `CLOUDINARY_API_SECRET`
- **Required**: Yes
- **Description**: Cloudinary API secret
- **Get from**: [Cloudinary Dashboard](https://cloudinary.com/console)
- **Security**: Keep this secret!

## Optional Variables

### Environment Settings

#### `NODE_ENV`
- **Required**: No
- **Default**: `development`
- **Options**: `development`, `production`, `staging`, `test`
- **Purpose**: Determines app behavior and optimizations

### Security Settings

#### `BCRYPT_ROUNDS`
- **Required**: No
- **Default**: `12`
- **Description**: Number of rounds for password hashing
- **Range**: 10-15 (higher = more secure but slower)

### File Upload Settings

#### `MAX_FILE_SIZE`
- **Required**: No
- **Default**: `5242880` (5MB)
- **Description**: Maximum file upload size in bytes
- **Format**: Number in bytes

#### `ALLOWED_FILE_TYPES`
- **Required**: No
- **Default**: `image/jpeg,image/png,image/webp,image/gif`
- **Description**: Comma-separated list of allowed MIME types
- **Format**: `type/subtype,type/subtype`

## Environment-Specific Examples

### Development (.env.local)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/hemp_dev
JWT_SECRET=dev-jwt-secret-not-for-production
NEXT_PUBLIC_APP_URL=http://localhost:3001
CLIENT_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### Production (.env.production)
```env
DATABASE_URL=postgresql://user:password@prod-db.com:5432/hemp_prod?sslmode=require
JWT_SECRET=super-secure-production-jwt-secret-64-characters-long
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
CLIENT_SITE_URL=https://yourdomain.com
NODE_ENV=production
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for each environment
3. **Rotate secrets regularly** (quarterly recommended)
4. **Use app passwords** for email services, never regular passwords
5. **Enable SSL/TLS** for all database connections in production
6. **Limit database user permissions** to only what's needed
7. **Use environment variables** for all secrets and configuration

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify database server is running
   - Ensure user has correct permissions
   - For production, check SSL requirements

2. **JWT Authentication Failed**
   - Verify `JWT_SECRET` is set and secure
   - Check if secret matches across deployments
   - Ensure secret is at least 32 characters

3. **Email Not Sending**
   - Verify SMTP settings are correct
   - For Gmail, use App Passwords, not regular passwords
   - Check firewall settings for SMTP ports

4. **Image Upload Failed**
   - Verify all Cloudinary credentials
   - Check file size limits
   - Ensure file types are allowed

### Getting Help

If you encounter issues:
1. Check the application logs
2. Verify all required environment variables are set
3. Test database connectivity separately
4. Check the main ecommerce site integration
5. Contact the development team with specific error messages

## Migration Notes

When updating from previous versions:
- New required variables may be added
- Some variable names might change
- Always backup your current `.env.local` before updating
- Check the changelog for breaking changes