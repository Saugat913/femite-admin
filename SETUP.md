# Hemp Admin Panel - Complete Setup Guide

This guide will help you set up the Hemp Fashion Admin Panel from scratch with a self-contained backend and database.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git (for cloning)

### 2. Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure your environment variables in `.env.local`:**
   ```env
   # Database Configuration (REQUIRED)
   DATABASE_URL=postgresql://username:password@localhost:5432/hemp_ecommerce
   
   # JWT Secret (REQUIRED - use a strong random string)
   JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
   
   # Optional: Admin user credentials (for setup script)
   ADMIN_EMAIL=admin@hempfashion.com
   ADMIN_PASSWORD=your-secure-password
   ```

### 3. Database Setup

**Option A: Automatic Setup (Recommended)**
```bash
npm run setup-db
```
This will:
- Create all required database tables
- Insert default settings and sample data
- Create an admin user account
- Set up sample categories and products

**Option B: Manual Setup**
If you prefer to set up manually:
```bash
# Apply migrations one by one
psql -d your_database_name -f migrations/001_initial_schema.sql
psql -d your_database_name -f migrations/002_add_categories.sql
psql -d your_database_name -f migrations/003_add_orders.sql
psql -d your_database_name -f migrations/004_add_inventory.sql
psql -d your_database_name -f migrations/005_add_settings.sql
psql -d your_database_name -f migrations/006_create_settings_table.sql
```

### 4. Start the Application
```bash
npm run dev
```

The admin panel will be available at [http://localhost:3000](http://localhost:3000)

### 5. Login
- **Email:** admin@hempfashion.com (or your configured email)
- **Password:** admin123 (or your configured password)

⚠️ **Important:** Change the default password after first login!

## 📊 Features Overview

### Dashboard
- Real-time sales and order statistics
- Revenue analytics with charts
- Low stock alerts
- Recent orders and customer activity

### Product Management
- Full CRUD operations (Create, Read, Update, Delete)
- Category management
- Image upload and media handling
- Inventory tracking and stock management
- Bulk operations (delete, update stock, change status)

### Order Management  
- Order listing with advanced filters
- Status updates (pending → paid → shipped → delivered)
- Customer information and order details
- Bulk status updates

### Customer Management
- User account management
- Role-based access (admin/customer)
- Customer activity and order history
- Bulk user operations

### Inventory Management
- Real-time stock tracking
- Low stock alerts and warnings
- Inventory movement logging
- Stock adjustment tools

### Analytics & Reporting
- Sales trends and performance
- Product analytics
- Customer insights
- Revenue reporting with interactive charts

### Settings
- Store configuration
- Shipping rules and rates
- Payment gateway settings
- System preferences

## 🔧 API Endpoints

The admin panel provides comprehensive REST APIs:

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout

### Dashboard & Analytics
- `GET /api/admin/analytics/dashboard` - Dashboard statistics and metrics

### Product Management
- `GET /api/admin/products` - List products (with filters/pagination)
- `POST /api/admin/products` - Create new product
- `GET /api/admin/products/[id]` - Get product details
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product

### Order Management
- `GET /api/admin/orders` - List orders (with filters/pagination)  
- `GET /api/admin/orders/[id]` - Get order details
- `PUT /api/admin/orders/[id]` - Update order status/details

### User Management
- `GET /api/admin/users` - List users (with filters/pagination)
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/[id]` - Get user details  
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Category Management
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/categories/[id]` - Get category
- `PUT /api/admin/categories/[id]` - Update category
- `DELETE /api/admin/categories/[id]` - Delete category

### Inventory Management
- `GET /api/admin/inventory` - List inventory with stock status
- `POST /api/admin/inventory/adjust` - Adjust stock levels

### File Upload
- `POST /api/admin/upload` - Upload single image
- `PUT /api/admin/upload` - Upload multiple images

### Settings
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings by category

### Bulk Operations
- `POST /api/admin/bulk` - Perform bulk operations on products/orders/users

## 🛡️ Security Features

- JWT-based authentication with secure HTTP-only cookies
- Role-based access control (admin/customer separation)
- API route protection with middleware
- SQL injection prevention with parameterized queries
- Password hashing with bcrypt
- Session management with expiration
- File upload validation and sanitization

## 📁 Database Schema

### Main Tables
- `users` - User accounts (customers and admins)
- `products` - Product catalog with inventory
- `categories` - Product categories
- `orders` - Customer orders
- `order_items` - Order line items
- `inventory_logs` - Stock movement history
- `settings` - System configuration

### Key Relationships
- Products belong to categories
- Orders belong to users
- Orders contain multiple order items
- Inventory logs track product stock changes
- Settings are grouped by category (store, shipping, payment)

## 🚀 Deployment

### Environment Variables for Production
```env
DATABASE_URL=your_production_database_url
JWT_SECRET=your_strong_production_jwt_secret
NODE_ENV=production
```

### Build and Deploy
```bash
npm run build
npm start
```

### Database Migration in Production
```bash
npm run setup-db
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Check database credentials and permissions

2. **Authentication Issues**
   - Verify `JWT_SECRET` is set and sufficiently long (32+ characters)
   - Clear browser cookies and try again
   - Check if admin user exists in database

3. **File Upload Issues**
   - Ensure `public/uploads` directory exists and is writable
   - Check file size limits (5MB default)
   - Verify allowed file types (JPEG, PNG, WebP)

4. **Migration Errors**
   - Run migrations in order (001, 002, 003, etc.)
   - Check database user has CREATE/ALTER permissions
   - Verify table names match between migrations and API code

### Getting Help

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database connection is working
4. Test API endpoints individually using tools like Postman

## 🎯 Next Steps

After setup, you can:

1. **Customize the Admin Panel:**
   - Modify components in `src/components/`
   - Add new admin pages in `src/app/(admin)/`
   - Customize styling in Tailwind CSS

2. **Extend the API:**
   - Add new endpoints in `src/app/api/admin/`
   - Create additional database models
   - Implement more advanced features

3. **Production Deployment:**
   - Set up SSL certificates
   - Configure production database
   - Set up monitoring and logging
   - Implement backup strategies

4. **Integration:**
   - Connect to external payment gateways
   - Integrate with shipping providers
   - Add email notifications
   - Implement advanced analytics

## 📚 Development Guide

### Project Structure
```
hemp-admin/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Protected admin pages
│   │   ├── api/              # API routes
│   │   └── login/            # Login page
│   ├── components/           # Reusable UI components  
│   ├── lib/                  # Utilities and services
│   │   ├── api.ts           # API service layer
│   │   ├── auth-service.ts  # Authentication logic
│   │   └── db.ts            # Database connection
│   └── types/               # TypeScript definitions
├── migrations/              # Database migration files
├── scripts/                 # Setup and utility scripts
└── public/uploads/          # Uploaded files directory
```

### Adding New Features

1. **New API Endpoint:** Create in `src/app/api/admin/[feature]/route.ts`
2. **New Admin Page:** Add to `src/app/(admin)/[page]/page.tsx`  
3. **New Component:** Create in `src/components/[ComponentName].tsx`
4. **Database Changes:** Add migration file in `migrations/`

This setup provides a complete, production-ready admin panel for managing your hemp fashion e-commerce store!