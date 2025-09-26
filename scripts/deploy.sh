#!/bin/bash

# Hemp Admin Panel - Production Deployment Script
# This script helps deploy the admin panel to production

set -e  # Exit on any error

echo "🌿 Hemp Admin Panel - Production Deployment"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and fill in your production values"
    exit 1
fi

# Check required environment variables
echo "🔍 Checking required environment variables..."

required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "NEXT_PUBLIC_APP_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] && ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please add these to your .env file"
    exit 1
fi

echo "✅ All required environment variables are set"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run database migrations
echo "🗄️  Running database migrations..."
if command -v psql &> /dev/null; then
    # Run migrations if PostgreSQL is available
    for migration in migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Running migration: $(basename "$migration")"
            psql $DATABASE_URL -f "$migration" || echo "Migration may have already been applied: $(basename "$migration")"
        fi
    done
else
    echo "⚠️  PostgreSQL client not found. Please run database migrations manually."
    echo "Migration files are in the /migrations directory"
fi

# Build the application
echo "🏗️  Building the application..."
npm run build

# Create production directories
echo "📁 Creating production directories..."
mkdir -p logs
mkdir -p uploads

# Set proper file permissions
echo "🔒 Setting file permissions..."
chmod 755 scripts/deploy.sh
chmod -R 750 logs
chmod -R 755 uploads

# Generate a deployment info file
echo "📝 Generating deployment info..."
cat > deployment-info.json << EOF
{
    "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "nodeVersion": "$(node --version)",
    "npmVersion": "$(npm --version)"
}
EOF

echo ""
echo "🎉 Deployment preparation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the application with: npm start"
echo "2. Set up a reverse proxy (nginx) to serve the app"
echo "3. Set up SSL certificates"
echo "4. Configure monitoring and logging"
echo "5. Set up backup procedures for the database"
echo ""
echo "Production checklist:"
echo "✅ Environment variables configured"
echo "✅ Dependencies installed"
echo "✅ Application built"
echo "✅ File permissions set"
echo ""
echo "⚠️  Remember to:"
echo "- Configure your web server (nginx/apache)"
echo "- Set up SSL certificates"
echo "- Configure firewall rules"
echo "- Set up database backups"
echo "- Configure log rotation"
echo ""