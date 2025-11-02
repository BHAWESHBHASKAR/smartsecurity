import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { emitToClient, emitToAdmins } from '../socket';

const webhookSchema = z.object({
  cameraId: z.string(),
  detectionType: z.enum(['HELMET', 'GUN']),
  confidence: z.number(),
  imageUrl: z.string().url(),
  timestamp: z.string(),
  signature: z.string(),
});

export async function handleDetectionWebhook(req: any, res: Response, next: NextFunction) {
  try {
    const data = webhookSchema.parse(req.body);

    // TODO: Verify webhook signature
    // const isValid = verifyWebhookSignature(data.signature, req.body);
    // if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    const camera = await prisma.camera.findUnique({
      where: { id: data.cameraId },
      include: {
        store: {
          include: {
            user: {
              select: { id: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!camera) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Camera not found' },
        timestamp: new Date().toISOString(),
      });
    }

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        storeId: camera.storeId,
        detectionType: data.detectionType,
        imageUrl: data.imageUrl,
        timestamp: new Date(data.timestamp),
      },
      include: {
        store: true,
      },
    });

    // Auto-activate siren
    await prisma.sirenLog.create({
      data: {
        storeId: camera.storeId,
        action: 'ON',
        triggeredBy: 'SYSTEM',
        alertId: alert.id,
      },
    });

    // Emit real-time events
    emitToClient(io, camera.store.userId, 'alert:new', alert);
    emitToClient(io, camera.store.userId, 'siren:status', { storeId: camera.storeId, status: true });
    emitToAdmins(io, 'alert:new', alert);

    // Send WhatsApp notification to police
    const { sendAlertNotification } = await import('../lib/twilio');
    await sendAlertNotification(
      camera.store.policeNumber,
      camera.store.name,
      camera.store.address,
      data.detectionType,
      data.imageUrl
    );

    res.json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAlerts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, storeId } = req.query;
    const user = req.user!;

    const where: any = {};

    if (user.role === 'CLIENT') {
      const store = await prisma.store.findUnique({
        where: { userId: user.id },
      });
      if (store) {
        where.storeId = store.id;
      }
    } else if (storeId) {
      where.storeId = storeId as string;
    }

    if (status) {
      where.status = status;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        store: {
          include: {
            user: {
              select: { phone: true },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Format alerts to include location and contact info
    const formattedAlerts = alerts.map(alert => ({
      ...alert,
      storeName: alert.store.name,
      location: {
        address: alert.store.address,
        latitude: alert.store.latitude,
        longitude: alert.store.longitude,
      },
      storeContact: {
        phone: alert.store.user.phone,
        policeNumber: alert.store.policeNumber,
      },
    }));

    res.json({
      success: true,
      data: formattedAlerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAlertById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        store: {
          include: {
            user: {
              select: { phone: true, email: true },
            },
          },
        },
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Alert not found' },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

const manualAlertSchema = z.object({
  storeId: z.string(),
  detectionType: z.enum(['HELMET', 'GUN', 'MANUAL']),
  imageUrl: z.string().url().optional(),
});

export async function createManualAlert(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = manualAlertSchema.parse(req.body);
    const adminId = req.user!.id;

    const alert = await prisma.alert.create({
      data: {
        storeId: data.storeId,
        detectionType: data.detectionType,
        imageUrl: data.imageUrl || '',
        initiatedBy: adminId,
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

    // Auto-activate siren
    await prisma.sirenLog.create({
      data: {
        storeId: data.storeId,
        action: 'ON',
        triggeredBy: adminId,
        alertId: alert.id,
      },
    });

    // Emit events
    emitToClient(io, alert.store.user.id, 'alert:new', alert);
    emitToClient(io, alert.store.user.id, 'siren:status', { storeId: data.storeId, status: true });
    emitToAdmins(io, 'alert:new', alert);

    res.status(201).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function createPanicAlert(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    // Get the client's store
    const store = await prisma.store.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, email: true, phone: true },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Store not found for this user' },
        timestamp: new Date().toISOString(),
      });
    }

    // Create manual alert
    const alert = await prisma.alert.create({
      data: {
        storeId: store.id,
        detectionType: 'MANUAL',
        imageUrl: '',
        initiatedBy: userId,
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

    // Auto-activate siren
    await prisma.sirenLog.create({
      data: {
        storeId: store.id,
        action: 'ON',
        triggeredBy: userId,
        alertId: alert.id,
      },
    });

    // Emit events
    emitToClient(io, userId, 'alert:new', alert);
    emitToClient(io, userId, 'siren:status', { storeId: store.id, status: true });
    emitToAdmins(io, 'alert:new', alert);

    // Send WhatsApp notification to police
    const { sendAlertNotification } = await import('../lib/twilio');
    await sendAlertNotification(
      store.policeNumber,
      store.name,
      store.address,
      'MANUAL',
      ''
    );

    res.status(201).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function resolveAlert(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: userId,
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

    // Turn off siren
    await prisma.sirenLog.create({
      data: {
        storeId: alert.storeId,
        action: 'OFF',
        triggeredBy: userId,
        alertId: alert.id,
      },
    });

    // Emit events
    emitToClient(io, alert.store.user.id, 'alert:resolved', id);
    emitToClient(io, alert.store.user.id, 'siren:status', { storeId: alert.storeId, status: false });
    emitToAdmins(io, 'alert:resolved', id);

    res.json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
