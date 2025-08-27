#!/bin/bash

# Hermes Chat Setup Script
# This script sets up the development environment for Hermes E2E encrypted chat

echo "🚀 Setting up Hermes E2E Encrypted Chat..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running!"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

print_success "docker-compose is available!"

# Create environment files
print_status "Creating environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    cp server/.env.example server/.env
    print_success "Created server/.env from example"
else
    print_warning "server/.env already exists"
fi

# Frontend environment
if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    print_success "Created .env.local from example"
else
    print_warning ".env.local already exists"
fi

# Install dependencies for server
print_status "Installing server dependencies..."
cd server && npm install
if [ $? -eq 0 ]; then
    print_success "Server dependencies installed!"
else
    print_error "Failed to install server dependencies"
    exit 1
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated!"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

cd ..

# Install frontend dependencies
print_status "Installing frontend dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed!"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Start Docker services
print_status "Starting Docker services..."
docker-compose up -d postgres redis

# Wait for database to be ready
print_status "Waiting for database to be ready..."
sleep 10

# Run database migrations
print_status "Running database migrations..."
cd server && npx prisma db push
if [ $? -eq 0 ]; then
    print_success "Database migrations completed!"
else
    print_error "Failed to run database migrations"
    exit 1
fi

cd ..

print_success "🎉 Hermes Chat setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Start the chat server: cd server && npm run dev"
print_status "2. Start the frontend: npm run dev"
print_status "3. Open http://localhost:3000 in your browser"
print_status ""
print_status "To start everything with Docker:"
print_status "  docker-compose up --build"
print_status ""
print_status "To stop Docker services:"
print_status "  docker-compose down"
print_status ""
print_warning "Remember to update the JWT_SECRET and database password in production!"
