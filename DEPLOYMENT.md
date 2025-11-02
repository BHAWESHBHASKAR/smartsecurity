# Smart Security System - Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Docker (Recommended)
```bash
# Clone and start with Docker
git clone <your-repo>
cd smart-security
docker-compose up -d
```
Access: http://localhost:3001

### Option 2: Direct Installation
```bash
# Clone and setup
git clone <your-repo>
cd smart-security
chmod +x start.sh
./start.sh
```

### Option 3: AWS EC2
```bash
# Launch EC2 with aws-deploy.yml as User Data
# Upload project and run:
pm2 start ecosystem.config.js
```

## 📦 What's Included

- ✅ **MediaMTX Server** - RTSP streaming engine
- ✅ **Demo Video** - Test content for streaming
- ✅ **Backend API** - Express server with MongoDB
- ✅ **Frontend App** - Next.js web interface
- ✅ **Production Scripts** - PM2, Docker, AWS configs
- ✅ **Clean Structure** - No development clutter

## 🔧 Configuration

### Environment Files
```bash
# Backend
DATABASE_URL="mongodb://localhost:27017/smart-security"
JWT_SECRET="your-secure-secret"
PORT=5001

# Frontend  
NEXT_PUBLIC_API_URL="http://localhost:5001"
```

### Ports Used
- **3001** - Frontend web interface
- **5001** - Backend API
- **8554** - RTSP input
- **8888** - HLS output
- **9997** - MediaMTX API

## 🎯 Ready for Production

This streamlined version is optimized for:
- ✅ GitHub deployment
- ✅ AWS EC2 hosting
- ✅ Docker containerization
- ✅ CI/CD pipelines
- ✅ Production scaling
