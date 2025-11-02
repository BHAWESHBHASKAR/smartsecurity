import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { emitToClient, emitToAdmins } from '../socket';

const DEVICE_STATUS_SCHEMA = z.object({
  storeId: z.string(),
  apiKey: z.string().min(1, 'apiKey is required'),
});

const toggleSchema = z.object({
  storeId: z.string(),
  action: z.enum(['ON', 'OFF']),
});

export async function getSirenStatusForDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const query = DEVICE_STATUS_SCHEMA.safeParse({
      storeId: req.query.storeId,
      apiKey: req.query.apiKey,
    });

    if (!query.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: query.error.issues[0]?.message || 'Invalid query parameters',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { storeId, apiKey } = query.data;
    const expectedApiKey = process.env.IOT_DEVICE_SECRET;

    if (!expectedApiKey) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'IOT_SECRET_NOT_CONFIGURED',
          message: 'IOT_DEVICE_SECRET environment variable is not configured',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (apiKey !== expectedApiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORE_NOT_FOUND',
          message: 'Store not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const latestLog = await prisma.sirenLog.findFirst({
      where: { storeId },
      orderBy: { timestamp: 'desc' },
    });

    const isOn = latestLog ? latestLog.action === 'ON' : false;

    return res.json({
      success: true,
      data: {
        status: isOn ? 'on' : 'off',
        updatedAt: latestLog?.timestamp || null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSiren(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = toggleSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify user has access to this store
    if (req.user!.role === 'CLIENT') {
      const store = await prisma.store.findUnique({
        where: { userId },
      });
      
      if (!store || store.id !== data.storeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this store',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Create siren log
    const sirenLog = await prisma.sirenLog.create({
      data: {
        storeId: data.storeId,
        action: data.action,
        triggeredBy: userId,
      },
      include: {
        store: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    // Emit status update
    const status = data.action === 'ON';
    emitToClient(io, sirenLog.store.user.id, 'siren:status', {
      storeId: data.storeId,
      status,
    });
    emitToAdmins(io, 'siren:status', {
      storeId: data.storeId,
      status,
    });

    res.json({
      success: true,
      data: sirenLog,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSirenLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.params;
    const { limit = '50' } = req.query;

    // Verify access
    if (req.user!.role === 'CLIENT') {
      const store = await prisma.store.findUnique({
        where: { userId: req.user!.id },
      });
      
      if (!store || store.id !== storeId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied to this store',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    const logs = await prisma.sirenLog.findMany({
      where: { storeId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
