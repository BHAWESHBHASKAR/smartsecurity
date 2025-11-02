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

const rawOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://localhost:3001',
];

const allowedOrigins = Array.from(
  new Set(
    rawOrigins.filter((origin): origin is string => Boolean(origin))
  )
);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
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
