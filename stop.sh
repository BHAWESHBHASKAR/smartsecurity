#!/bin/bash

# Smart Security System Stop Script

echo "🛑 Stopping Smart Security System..."

# Kill all related processes
pkill -f mediamtx
pkill -f "node.*backend"
pkill -f "npm.*dev"
pkill -f ffmpeg

echo "✅ All services stopped successfully!"
