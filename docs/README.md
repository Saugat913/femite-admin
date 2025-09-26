# Femite Hemp Fashion - Admin Panel

A comprehensive admin panel for managing the Femite hemp fashion e-commerce store. Built with Next.js 15, React 19, and TypeScript with a clean black and white theme.

## Features

### 🏪 Store Management
- **Dashboard**: Overview of sales, orders, customers, and inventory
- **Products**: Complete CRUD operations for products with image upload
- **Categories**: Organize products into categories
- **Inventory**: Track stock levels, low stock alerts, and inventory movements
- **Orders**: Manage order lifecycle from payment to delivery
- **Customers**: User management and customer analytics

### 📊 Analytics & Reporting
- **Sales Analytics**: Revenue trends, top products, and performance metrics
- **Business Intelligence**: Customer insights and product performance
- **Export Functionality**: Download reports and data exports

### ⚙️ Configuration
- **Store Settings**: Basic store information and tax configuration
- **Shipping**: Configure shipping zones, rates, and free shipping thresholds
- **Payment Methods**: Setup Stripe, PayPal, and cash on delivery options

### 🎨 Design & UX
- **Black & White Theme**: Clean, professional monochrome design
- **Responsive**: Fully responsive design for all device sizes
- **Accessible**: WCAG compliant with proper focus management
- **Fast**: Optimized performance with Next.js 15

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (connects to main e-commerce backend)
- **Authentication**: JWT with secure HTTP-only cookies
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React
- **State Management**: React hooks + Context API

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- SMTP email service (Gmail, SendGrid, etc.)
- Cloudinary account for image uploads

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd hemp-admin
   npm install
   ```

2. **Environment Setup**
   
   Create and configure your environment variables in `.env.local`:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@host:port/database
   
   # Authentication
   JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-256-bits
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME="Hemp Fashion Admin"
   
   # Cloudinary (Sign up at https://cloudinary.com)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Application URLs
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
   NEXT_PUBLIC_MAIN_SITE_URL=http://localhost:3000
   ```

3. **Database Setup**
   
   Run the database setup script to create tables and sample data:
   ```bash
   npm run setup-db
   ```
   
   This will:
   - Create all required tables
   - Set up admin user (admin@hempfashion.com / admin123)
   - Add sample categories and products
   - Configure newsletter table

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The admin panel will be available at `http://localhost:3001`

5. **Admin Login**
   - Email: `admin@hempfashion.com`
   - Password: `admin123`
   
   **⚠️ Change the default password immediately after first login!**

### Production Deployment

1. **Environment Variables**
   
   Set production environment variables:
   ```env
   NODE_ENV=production
   DATABASE_URL=your-production-database-url
   JWT_SECRET=your-production-jwt-secret
   
   # Email service
   SMTP_HOST=your-production-smtp-host
   SMTP_USER=your-production-email
   SMTP_PASS=your-production-password
   
   # Cloudinary production credentials
   CLOUDINARY_CLOUD_NAME=your-production-cloud-name
   CLOUDINARY_API_KEY=your-production-api-key
   CLOUDINARY_API_SECRET=your-production-api-secret
   
   # Security
   COOKIE_SECURE=true
   COOKIE_SAME_SITE=strict
   
   # URLs
   NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
   NEXT_PUBLIC_MAIN_SITE_URL=https://yourmainsite.com
   ```

2. **Database Migration**
   
   Run migrations on production database:
   ```bash
   npm run setup-db
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Start production server**
   ```bash
   npm start
   ```

5. **Security Checklist**
   - [ ] Change default admin password
   - [ ] Enable HTTPS
   - [ ] Configure firewall rules
   - [ ] Set up SSL certificates
   - [ ] Enable database SSL
   - [ ] Configure CORS properly
   - [ ] Set up monitoring and logging
   - [ ] Configure backup strategy

## Authentication & Security

- **JWT Tokens**: Secure authentication with HTTP-only cookies
- **Role-Based Access**: Admin-only access with role verification
- **CSRF Protection**: Built-in CSRF protection
- **Secure Headers**: Security headers for production deployment
- **Input Validation**: Server-side validation for all inputs

## Key Features

### Dashboard
- Real-time sales metrics and KPIs
- Recent orders overview with quick actions
- Low stock alerts and inventory warnings
- Performance charts and trends
- Quick navigation to key areas

### Product Management
- Advanced filtering and search capabilities
- Bulk operations (edit, delete, export)
- Stock management with adjustment tracking
- Category assignment and organization
- Image upload and management

### Order Management  
- Complete order lifecycle tracking
- Status updates with detailed notes
- Shipping integration and tracking
- Customer communication tools
- Bulk status updates for efficiency

### Analytics & Reporting
- Sales trend analysis with date filtering
- Product performance metrics
- Customer behavior insights
- Revenue reporting and forecasting
- Exportable data in multiple formats

### Inventory Management
- Real-time stock level tracking
- Automated low stock notifications
- Detailed inventory movement logs
- Bulk stock adjustments with reasons
- Integration with order fulfillment

## API Integration

The admin panel integrates seamlessly with the main e-commerce backend:

- **Products API**: Full CRUD operations with search and filtering
- **Orders API**: Order management and status updates
- **Users API**: Customer management and analytics
- **Analytics API**: Business intelligence and reporting
- **Settings API**: Store configuration management

*See the main project documentation for detailed API specifications.*

## Development

The admin panel is built with modern development practices:

- **TypeScript**: Full type safety throughout the application
- **Component Architecture**: Reusable, maintainable components
- **API Layer**: Centralized API management with error handling
- **State Management**: Efficient state handling with React hooks
- **Error Boundaries**: Graceful error handling and recovery

## Deployment

**Admin Panel URL**: `http://localhost:3001` (development)
**Main Store URL**: `http://localhost:3000` (development)

For production deployment, ensure proper environment variables and database connections are configured.

---

*This admin panel is part of the Femite Hemp Fashion e-commerce platform, providing comprehensive store management capabilities with a focus on usability and performance.*
