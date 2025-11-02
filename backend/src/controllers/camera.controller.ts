import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { io } from '../server';
import { emitToClient } from '../socket';
import { validateRtspUrl, addStream, removeStream } from '../lib/go2rtc';

export async function getCameras(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { storeId } = req.query;

    let where: any = {};

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

    const cameras = await prisma.camera.findMany({
      where,
      orderBy: { position: 'asc' },
    });

    res.json({
      success: true,
      data: cameras,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function createCamera(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { rtspUrl, storeId, position } = req.body as {
      rtspUrl: string;
      storeId?: string;
      position?: number;
    };

    // Validate RTSP URL
    const validation = validateRtspUrl(rtspUrl);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'INVALID_RTSP_URL', 
          message: validation.error || 'Invalid RTSP URL format' 
        },
        timestamp: new Date().toISOString(),
      });
    }

    let targetStoreId = storeId;

    if (user.role === 'CLIENT') {
      const store = await prisma.store.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!store) {
        return res.status(400).json({
          success: false,
          error: { code: 'STORE_NOT_CONFIGURED', message: 'Store setup is required before adding cameras' },
          timestamp: new Date().toISOString(),
        });
      }

      if (targetStoreId && targetStoreId !== store.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You are not allowed to add cameras to this store' },
          timestamp: new Date().toISOString(),
        });
      }

      targetStoreId = store.id;
    } else if (!targetStoreId) {
      return res.status(400).json({
        success: false,
        error: { code: 'STORE_ID_REQUIRED', message: 'storeId is required when adding cameras as an admin' },
        timestamp: new Date().toISOString(),
      });
    }

    const existingCameras = await prisma.camera.findMany({
      where: { storeId: targetStoreId },
      select: { position: true, ipAddress: true, streamUrl: true },
    });

    const duplicate = existingCameras.find(
      (camera) => camera.ipAddress === rtspUrl || camera.streamUrl === rtspUrl
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: { code: 'CAMERA_EXISTS', message: 'A camera with this RTSP URL already exists' },
        timestamp: new Date().toISOString(),
      });
    }

    const nextPosition =
      typeof position === 'number'
        ? position
        : existingCameras.length === 0
        ? 0
        : Math.max(...existingCameras.map((camera) => camera.position ?? 0)) + 1;

    // Create camera in database first
    const camera = await prisma.camera.create({
      data: {
        storeId: targetStoreId!,
        ipAddress: validation.normalized || rtspUrl,
        streamUrl: validation.normalized || rtspUrl,
        position: nextPosition,
        status: 'ACTIVE',
      },
    });

    // Register stream with go2rtc (non-blocking)
    // If this fails, the camera is still created but won't stream until fixed
    try {
      await addStream(camera.id, validation.normalized || rtspUrl);
      console.log(`Camera ${camera.id} registered with go2rtc`);
    } catch (error: any) {
      console.error(`Failed to register camera ${camera.id} with go2rtc:`, error.message);
      // Don't fail the request - camera is created, streaming will be attempted on first access
    }

    res.status(201).json({
      success: true,
      data: camera,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCamera(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const camera = await prisma.camera.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            userId: true,
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

    if (user.role === 'CLIENT' && camera.store.userId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not allowed to delete this camera' },
        timestamp: new Date().toISOString(),
      });
    }

    // Remove stream from go2rtc (non-blocking)
    try {
      await removeStream(camera.id);
      console.log(`Camera ${camera.id} removed from go2rtc`);
    } catch (error: any) {
      console.error(`Failed to remove camera ${camera.id} from go2rtc:`, error.message);
      // Continue with deletion even if go2rtc removal fails
    }

    await prisma.camera.delete({ where: { id } });

    res.json({
      success: true,
      data: { id },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCameraById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const camera = await prisma.camera.findUnique({
      where: { id },
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

    if (!camera) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Camera not found' },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: camera,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCameraStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const camera = await prisma.camera.update({
      where: { id },
      data: { status },
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
    emitToClient(io, camera.store.user.id, 'camera:status', {
      cameraId: camera.id,
      status: camera.status,
    });

    res.json({
      success: true,
      data: camera,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
