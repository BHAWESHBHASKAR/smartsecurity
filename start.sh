#!/bin/bash

# Smart Security System Startup Script
# For AWS EC2 deployment

echo "🚀 Starting Smart Security System..."

# Set environment variables
export NODE_ENV=production
export PORT=5001
export FRONTEND_URL=http://localhost:3001

# Kill any existing processes
echo "📋 Cleaning up existing processes..."
pkill -f mediamtx || true
pkill -f "node.*backend" || true
pkill -f "npm.*dev" || true

# Start MediaMTX server
echo "📡 Starting MediaMTX server..."
cd mediamtx
./mediamtx ../mediamtx-config.yml &
MEDIAMTX_PID=$!
cd ..

# Wait for MediaMTX to start
sleep 3

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start backend server
echo "🔧 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Smart Security System started successfully!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:5001"
echo "📡 MediaMTX API: http://localhost:9997"
echo ""
echo "Process IDs:"
echo "MediaMTX: $MEDIAMTX_PID"
echo "Backend: $BACKEND_PID"
echo "Frontend: $FRONTEND_PID"
echo ""
echo "To stop all services, run: ./stop.sh"
