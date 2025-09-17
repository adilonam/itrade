#!/bin/bash

# Trading App Development Setup Script

echo "🚀 Setting up Trading App development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Start PostgreSQL database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check database health
while ! docker-compose exec -T postgres pg_isready -U trading_user -d trading_app_db > /dev/null 2>&1; do
    echo "⏳ Still waiting for database..."
    sleep 2
done

echo "✅ Database is ready"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "🎉 Setup complete! You can now:"
echo "   • Start the development server: pnpm dev"
echo "   • View the database: pnpm prisma studio"
echo "   • Stop the database: docker-compose down"
