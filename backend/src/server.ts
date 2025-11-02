import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { resolve } from 'path';
import { initializeSocket } from './socket';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import alertRoutes from './routes/alert.routes';
import cameraRoutes from './routes/camera.routes';
import sirenRoutes from './routes/siren.routes';
import streamRoutes from './routes/stream.routes';
import testRoutes from './routes/test.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    const envOrigins = [
      process.env.FRONTEND_URL,
      'http://13.53.43.229:3001',
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter((value): value is string => Boolean(value));

    const allowedOrigins = new Set(
      envOrigins.map((value) => value.replace(/\/$/, ''))
    );

    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'],
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/siren', sirenRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/test', testRoutes);

// Error handler
app.use(errorHandler);

// Initialize Socket.io
initializeSocket(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
});

export { io };
