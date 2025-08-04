#!/bin/bash

echo "🚀 Setting up Chronos Synapse..."
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies  
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "🔧 Setting up environment files..."
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

echo ""
echo "⚠️  IMPORTANT: Edit backend/.env and add your Anthropic API key!"
echo ""

# Start Redis Stack
echo "🐳 Starting Redis Stack with Docker..."
docker-compose up -d

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. Edit backend/.env and add your Anthropic API key"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "🌐 Services:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:3001"
echo "   RedisInsight: http://localhost:8001"
echo ""
echo "🔥 Ready to build the future of cron management!" 