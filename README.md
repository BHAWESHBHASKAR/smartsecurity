# Smart Security System

A comprehensive security monitoring system with real-time RTSP camera feeds, alert management, and emergency response capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- FFmpeg (included for video processing)

### Installation
```bash
# 1. Clone and setup
git clone <your-repo-url>
cd smart-security

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit .env files with your settings

# 3. Install dependencies and start
chmod +x start.sh
./start.sh
```

### Access
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **MediaMTX**: http://localhost:9997

## 📋 Features

- ✅ **Real-time RTSP Streaming** - Live camera feeds with MediaMTX
- ✅ **Multi-Camera Support** - IP cameras and RTSP URLs
- ✅ **Alert Management** - Automated detection and notifications
- ✅ **Emergency Response** - Siren control and police alerts
- ✅ **User Management** - Multi-user with role-based access
- ✅ **Mobile Responsive** - Works on all devices

## 🛠 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Prisma
- **Streaming**: MediaMTX, HLS.js, WebRTC
- **Authentication**: JWT, Socket.io

## 🌐 AWS Deployment

### EC2 Setup
1. **Launch EC2 Instance** (Ubuntu 20.04+, t3.medium recommended)
2. **Security Groups**: Open ports 22, 80, 443, 3001, 5001, 8554, 8888, 9997
3. **User Data Script**: Use `aws-deploy.yml` content
4. **Upload Project**: 
   ```bash
   scp -r . ubuntu@your-ec2-ip:/opt/smart-security/
   ```

### Production Start
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## 📷 RTSP Camera Setup

### Supported Formats
```bash
# IP Address (system will construct RTSP URL)
192.168.1.100

# Full RTSP URL
rtsp://admin:password@192.168.1.100:554/stream1

# Common Camera URLs
rtsp://admin:password@ip:554/Streaming/Channels/101  # Hikvision
rtsp://admin:password@ip:554/cam/realmonitor?channel=1  # Dahua
rtsp://root:password@ip:554/axis-media/media.amp  # Axis
```

### Demo Stream
The system includes a demo video for testing:
- **RTSP**: `rtsp://localhost:8554/demo-video`
- **HLS**: `http://localhost:8888/demo-video/index.m3u8`

## 🔧 Configuration

### Backend Environment (.env)
```env
DATABASE_URL="mongodb://localhost:27017/smart-security"
JWT_SECRET="your-secure-jwt-secret"
PORT=5001
FRONTEND_URL="http://localhost:3001"
```

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:5001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5001"
```

## 📁 Project Structure
```
smart-security/
├── backend/          # Express API server
├── frontend/         # Next.js web app
├── mediamtx/         # MediaMTX streaming server
├── video/            # Demo video files
├── start.sh          # Development startup
├── stop.sh           # Stop all services
├── ecosystem.config.js # PM2 production config
└── aws-deploy.yml    # AWS deployment script
```

## 🐛 Troubleshooting

### Camera Issues
- **Not connecting**: Check RTSP URL format and network access
- **No video**: Verify MediaMTX logs and HLS stream availability
- **Poor quality**: Adjust camera resolution and bitrate settings

### System Issues
- **Backend errors**: Check `backend/logs/` and MongoDB connection
- **Frontend issues**: Check browser console and API connectivity
- **Streaming problems**: Verify MediaMTX is running on correct ports

### Quick Fixes
```bash
# Restart all services
./stop.sh && ./start.sh

# Check service status
pm2 status

# View logs
pm2 logs smart-security-backend
pm2 logs mediamtx
```

## 📊 Monitoring

### Health Checks
- **Backend**: `GET http://localhost:5001/health`
- **MediaMTX**: `GET http://localhost:9997/v3/config/global/get`
- **Frontend**: `GET http://localhost:3001`

### Performance
- **Streaming Latency**: 2-5 seconds (HLS), <1 second (WebRTC)
- **Concurrent Cameras**: Up to 16 per instance
- **Resource Usage**: ~1GB RAM, 2 CPU cores recommended

## 🔒 Security

- JWT authentication with secure sessions
- CORS protection for API endpoints
- Input validation and sanitization
- Rate limiting on authentication endpoints
- Secure camera credential storage

## 📄 License

MIT License - Open source security monitoring system.
