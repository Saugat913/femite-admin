# Client Site Revalidation Integration

This document explains how the Hemp Admin Panel integrates with the client e-commerce site to trigger cache revalidation when content is updated.

## Overview

The admin panel automatically triggers cache revalidation on the client e-commerce site whenever:
- ✅ Products are created, updated, or deleted
- ✅ Blog posts are created, updated, or deleted  
- ✅ Bulk operations are performed on products

This ensures that the client site shows the latest content immediately after changes are made in the admin panel.

## Setup Instructions

### 1. Configure Environment Variables

In your admin panel's `.env.local` file, add:

```bash
# Client Site Configuration (for revalidation)
CLIENT_SITE_URL=http://localhost:3000
CLIENT_SITE_REVALIDATION_SECRET=your-super-secure-revalidation-secret-key
```

In your client site's `.env.local` file, add:

```bash
# Revalidation Secret (for ISR cache invalidation from admin panel)
REVALIDATION_SECRET=your-super-secure-revalidation-secret-key
```

**Important**: Both secrets must match exactly!

### 2. Update Configuration

Replace the URLs and secret with your actual values:

#### Development
```bash
CLIENT_SITE_URL=http://localhost:3000
CLIENT_SITE_REVALIDATION_SECRET=dev-secret-key-123
```

#### Production
```bash
CLIENT_SITE_URL=https://your-ecommerce-site.com
CLIENT_SITE_REVALIDATION_SECRET=prod-super-secure-key-xyz
```

## Testing the Integration

### 1. Test Connection

Make a GET request to test the connection:

```bash
curl http://localhost:3001/api/admin/test-revalidation
```

Expected response:
```json
{
  "success": true,
  "data": {
    "config": {
      "clientSiteUrl": "http://localhost:3000",
      "revalidationEndpoint": "http://localhost:3000/api/revalidate",
      "hasSecret": true
    },
    "connectionTest": {
      "success": true,
      "endpoint": "http://localhost:3000/api/revalidate",
      "message": "Revalidation endpoint is active"
    }
  }
}
```

### 2. Test Manual Revalidation

```bash
# Test all pages revalidation
curl -X POST http://localhost:3001/api/admin/test-revalidation \
  -H "Content-Type: application/json" \
  -d '{"type":"all"}'

# Test product revalidation
curl -X POST http://localhost:3001/api/admin/test-revalidation \
  -H "Content-Type: application/json" \
  -d '{"type":"product","id":"product-id-123"}'

# Test blog revalidation  
curl -X POST http://localhost:3001/api/admin/test-revalidation \
  -H "Content-Type: application/json" \
  -d '{"type":"blog","id":"blog-slug"}'
```

## How It Works

### Automatic Revalidation

The admin panel automatically triggers revalidation in these scenarios:

#### Product Operations
- **Create Product**: Revalidates `/`, `/shop`, and `/shop/[id]`
- **Update Product**: Revalidates `/`, `/shop`, and `/shop/[id]`  
- **Delete Product**: Revalidates `/`, `/shop`, and `/shop/[id]`
- **Bulk Operations**: Revalidates all product-related pages

#### Blog Operations
- **Create Blog Post**: Revalidates `/`, `/blog`, and `/blog/[slug]`
- **Update Blog Post**: Revalidates `/`, `/blog`, and `/blog/[slug]` (handles slug changes)
- **Delete Blog Post**: Revalidates `/`, `/blog`, and `/blog/[slug]`

### Implementation Details

The revalidation is implemented as background operations that don't block the admin API responses:

```typescript
// Example from product creation
const createdProduct = productWithCategories.rows[0]

// Trigger client site cache revalidation (async, don't wait for completion)
revalidateAfterProductChange(createdProduct.id)

// Continue with response
return NextResponse.json({
  success: true,
  data: createdProduct,
  message: 'Product created successfully'
})
```

## Monitoring and Logging

### Admin Panel Logs

The admin panel logs revalidation attempts:

```
🔄 Triggering revalidation: {"type":"product","id":"product-123"}
✅ Revalidation successful: ["/","/shop","/shop/product-123"]
```

### Client Site Logs

The client site logs incoming revalidation requests:

```
Revalidated product path: /shop/product-123
Revalidated path: /
Revalidated path: /shop
```

## Troubleshooting

### Common Issues

1. **"Revalidation secret not configured"**
   - Ensure `CLIENT_SITE_REVALIDATION_SECRET` is set in admin panel
   - Ensure `REVALIDATION_SECRET` is set in client site
   - Verify both secrets match exactly

2. **"Connection failed" or timeout errors**
   - Check that `CLIENT_SITE_URL` is correct
   - Ensure client site is running and accessible
   - Check firewall/network settings

3. **"Invalid or missing secret" (401 error)**
   - Verify the secrets match between admin panel and client site
   - Check for extra spaces or encoding issues

4. **Changes not visible on client site**
   - Check client site logs for revalidation messages
   - Try manual revalidation via test endpoint
   - Clear browser cache and try again
   - Check if client site is using the correct revalidation intervals

### Debug Steps

1. **Test connection**:
   ```bash
   curl http://localhost:3001/api/admin/test-revalidation
   ```

2. **Check client site revalidation endpoint**:
   ```bash
   curl http://localhost:3000/api/revalidate
   ```

3. **Test manual revalidation**:
   ```bash
   curl -X POST http://localhost:3001/api/admin/test-revalidation \
     -H "Content-Type: application/json" \
     -d '{"type":"all"}'
   ```

4. **Check logs** in both admin panel and client site terminals

## File Locations

### Admin Panel Files
- **Service**: `/src/lib/revalidation-service.ts`
- **Test Endpoint**: `/src/app/api/admin/test-revalidation/route.ts`
- **Product Integration**: `/src/app/api/admin/products/route.ts`, `/src/app/api/admin/products/[id]/route.ts`
- **Blog Integration**: `/src/app/api/admin/blog/route.ts`, `/src/app/api/admin/blog/[id]/route.ts`
- **Bulk Integration**: `/src/app/api/admin/bulk/route.ts`

### Client Site Files
- **Revalidation API**: `/app/api/revalidate/route.ts`
- **Page Configuration**: ISR settings in all page components
- **Documentation**: `/ADMIN_INTEGRATION.md`

## Security Considerations

1. **Secret Management**: Store secrets in environment variables, never in code
2. **HTTPS**: Use HTTPS in production for all revalidation requests
3. **Network Access**: Ensure admin panel can reach client site
4. **Error Handling**: Revalidation failures don't break admin operations
5. **Rate Limiting**: Consider implementing rate limiting for revalidation endpoints

## Performance Impact

- **Admin Panel**: Minimal impact - revalidation runs in background
- **Client Site**: Minimal impact - revalidation is cached and throttled
- **Network**: Light HTTP POST requests only when content changes
- **User Experience**: Seamless - users see updated content immediately

This integration ensures that your e-commerce site always displays the latest content while maintaining excellent performance through intelligent caching.