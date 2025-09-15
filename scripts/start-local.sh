#!/bin/bash

set -e

echo "🏠 Home Hub - Local Development Setup"
echo "===================================="

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "💰 Cost: $0 (runs locally)"
echo "🚀 Starting Home Hub with Docker Compose..."

# Build the frontend first
echo "📦 Building frontend..."
cd client && npm install && npm run build && cd ..

# Start services
echo "🐳 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
    echo ""
    echo "🌐 Your Home Hub is available at:"
    echo "   http://localhost:5000"
    echo ""
    echo "🔑 Login credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo "   ⚠️  Change the password immediately!"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   View database: docker-compose exec postgres psql -U homehub_user -d homehub_dev"
else
    echo "❌ Failed to start services. Check logs:"
    docker-compose logs
    exit 1
fi