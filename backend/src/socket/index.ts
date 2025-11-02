import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

export function initializeSocket(io: Server) {
  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as User;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?.id}`);

    // Join user-specific room
    if (socket.user?.role === 'CLIENT' && socket.user.id) {
      socket.join(`client:${socket.user.id}`);
    } else if (socket.user?.role === 'ADMIN') {
      socket.join('admin');
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user?.id}`);
    });
  });

  return io;
}

export function emitToClient(io: Server, userId: string, event: string, data: any) {
  io.to(`client:${userId}`).emit(event, data);
}

export function emitToAdmins(io: Server, event: string, data: any) {
  io.to('admin').emit(event, data);
}

export function emitToAll(io: Server, event: string, data: any) {
  io.emit(event, data);
}
