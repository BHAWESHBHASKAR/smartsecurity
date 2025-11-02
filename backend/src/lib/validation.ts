import { z } from 'zod';

const rtspUrlRegex = /^rtsp(s)?:\/\/.+/i;
const rtspUrlErrorMessage = 'Invalid RTSP URL. Expected format: rtsp://<ip-or-domain>[:port]/path';
export const rtspUrlSchema = z
  .string()
  .trim()
  .regex(rtspUrlRegex, rtspUrlErrorMessage);

// Auth validation schemas
export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLIENT', 'ADMIN']).optional(),
});

// Setup/Store validation schemas
export const setupSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  policeNumber: z.string().regex(/^[+]?\d{7,15}$/, 'Invalid police number'),
  cameraIPs: z.array(rtspUrlSchema).min(1, 'At least one camera RTSP URL is required'),
});

export const updateStoreSchema = z.object({
  storeName: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  policeNumber: z.string().regex(/^[+]?\d{7,15}$/).optional(),
});

// Camera validation schemas
export const cameraIPSchema = z.object({
  ipAddress: rtspUrlSchema,
  position: z.number().int().min(0).optional(),
});

export const createCameraSchema = z.object({
  storeId: z.string().trim().regex(/^[a-f\d]{24}$/i, 'Invalid store ID').optional(),
  rtspUrl: rtspUrlSchema,
  position: z.number().int().min(0).optional(),
});

export const updateCameraStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']),
});

// Alert validation schemas
export const createAlertSchema = z.object({
  cameraId: z.string().cuid('Invalid camera ID'),
  detectionType: z.enum(['HELMET', 'GUN', 'MANUAL']),
  imageUrl: z.string().url('Invalid image URL'),
  confidence: z.number().min(0).max(1).optional(),
});

export const updateAlertSchema = z.object({
  status: z.enum(['ACTIVE', 'RESOLVED']),
  resolvedBy: z.string().cuid().optional(),
});

// Siren validation schemas
export const sirenActionSchema = z.object({
  action: z.enum(['ON', 'OFF']),
  storeId: z.string().cuid('Invalid store ID'),
  alertId: z.string().cuid().optional(),
});

// User management validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[+]?\d{7,15}$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLIENT', 'ADMIN']),
  storeName: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  policeNumber: z.string().regex(/^[+]?\d{7,15}$/).optional(),
  cameraIPs: z.array(rtspUrlSchema).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  password: z.string().min(6).optional(),
});

// Validation middleware helper
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          timestamp: new Date().toISOString(),
        });
      }
      next(error);
    }
  };
}
