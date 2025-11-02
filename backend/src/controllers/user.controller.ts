import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const setupSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
  policeNumber: z.string().min(10, 'Valid police number is required'),
  cameraIPs: z.array(z.string()).min(1, 'At least one camera IP is required'),
});

export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        store: {
          include: {
            cameras: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function setupStore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = setupSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if store already exists
    const existingStore = await prisma.store.findUnique({
      where: { userId },
    });

    if (existingStore) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'STORE_EXISTS',
          message: 'Store already set up for this user',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Create store with cameras
    const store = await prisma.store.create({
      data: {
        userId,
        name: data.storeName,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        policeNumber: data.policeNumber,
        cameras: {
          create: data.cameraIPs.map((ip, index) => ({
            ipAddress: ip,
            position: index,
            status: 'INACTIVE',
          })),
        },
      },
      include: {
        cameras: true,
      },
    });

    res.json({
      success: true,
      data: store,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search } = req.query;

    const users = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        ...(search && {
          OR: [
            { email: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string } },
            { store: { name: { contains: search as string, mode: 'insensitive' } } },
          ],
        }),
      },
      include: {
        store: {
          include: {
            cameras: true,
          },
        },
      },
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.json({
      success: true,
      data: usersWithoutPasswords,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  storeName: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number(),
  longitude: z.number(),
  policeNumber: z.string().min(10, 'Valid police number is required'),
  cameraIPs: z.array(z.string()).min(1, 'At least one camera IP is required'),
});

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createUserSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'CLIENT',
        store: {
          create: {
            name: data.storeName,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            policeNumber: data.policeNumber,
            cameras: {
              create: data.cameraIPs.map((ip, index) => ({
                ipAddress: ip,
                position: index,
                status: 'INACTIVE',
              })),
            },
          },
        },
      },
      include: {
        store: {
          include: {
            cameras: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.password && { password: await bcrypt.hash(data.password, 10) }),
        ...(data.store && {
          store: {
            update: {
              ...(data.store.name && { name: data.store.name }),
              ...(data.store.address && { address: data.store.address }),
              ...(data.store.policeNumber && { policeNumber: data.store.policeNumber }),
            },
          },
        }),
      },
      include: {
        store: {
          include: {
            cameras: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}
