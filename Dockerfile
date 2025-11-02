# Multi-stage Docker build for Smart Security System
FROM node:18-alpine AS base

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Copy source code
COPY backend ./backend
COPY frontend ./frontend
COPY mediamtx ./mediamtx
COPY video ./video
COPY mediamtx-config.yml ./
COPY ecosystem.config.js ./

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Expose ports
EXPOSE 3001 5001 8554 8888 8889 9997

# Start script
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
