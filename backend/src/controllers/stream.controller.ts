import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { 
    addStream, 
    getStreamInfo, 
    generateStreamUrls, 
    isMediaMTXAvailable,
    validateRtspUrl,
    waitForStreamReady
} from '../lib/mediamtx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const STREAM_TOKEN_EXPIRY = '1h';

interface StreamTokenPayload {
    cameraId: string;
    userId: string;
    storeId: string;
}

export async function getStreamUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { cameraId } = req.params;
        const user = req.user!;

        // Get camera and verify access
        const camera = await prisma.camera.findUnique({
            where: { id: cameraId },
            include: {
                store: {
                    include: {
                        user: {
                            select: { id: true, role: true },
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

        // Check permissions
        if (user.role === 'CLIENT' && camera.store.user.id !== user.id) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Access denied' },
                timestamp: new Date().toISOString(),
            });
        }

        // Check if MediaMTX is available
        const mediaMTXReady = await isMediaMTXAvailable();
        if (!mediaMTXReady) {
            return res.status(502).json({
                success: false,
                error: { 
                    code: 'MEDIAMTX_UNAVAILABLE', 
                    message: 'Streaming service is not available. Please ensure MediaMTX is running.' 
                },
                timestamp: new Date().toISOString(),
            });
        }

        // Get stream source
        const streamSource = camera.streamUrl || camera.ipAddress;

        if (!streamSource) {
            return res.status(400).json({
                success: false,
                error: { 
                    code: 'NO_STREAM_SOURCE', 
                    message: 'Camera does not have a stream URL configured. Please add an RTSP URL.' 
                },
                timestamp: new Date().toISOString(),
            });
        }

        // Use camera ID as stream identifier in MediaMTX
        const streamId = camera.id;

        // Check if stream exists in MediaMTX
        let streamInfo = await getStreamInfo(streamId);

        // If stream doesn't exist or is not ready, register it
        if (!streamInfo || !streamInfo.ready) {
            try {
                console.log(`Registering stream ${streamId} with source: ${streamSource}`);
                await addStream(streamId, streamSource);
                
                // Wait for stream to be ready (with timeout)
                const isReady = await waitForStreamReady(streamId, 8000);
                
                if (!isReady) {
                    console.warn(`Stream ${streamId} registered but not ready yet`);
                }
                
                // Get updated stream info
                streamInfo = await getStreamInfo(streamId);
            } catch (error: any) {
                console.error(`Failed to register stream ${streamId}:`, error.message);
                return res.status(500).json({
                    success: false,
                    error: { 
                        code: 'STREAM_REGISTRATION_FAILED', 
                        message: `Failed to register camera stream: ${error.message}` 
                    },
                    timestamp: new Date().toISOString(),
                });
            }
        }

        // Generate secure token
        const tokenPayload: StreamTokenPayload = {
            cameraId: camera.id,
            userId: user.id,
            storeId: camera.storeId,
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: STREAM_TOKEN_EXPIRY });

        // Generate all stream format URLs
        const urls = generateStreamUrls(streamId);
        
        // Special handling for demo camera - use frontend-served HLS
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const demoStreamUrl = `${frontendUrl}/streams/${streamId}/index.m3u8`;

        res.json({
            success: true,
            data: {
                streamUrl: demoStreamUrl, // Use frontend-served HLS for demo
                alternativeUrls: {
                    webrtc: urls.webrtc,
                    mjpeg: urls.mjpeg,
                    hls: urls.hls,
                    rtsp: urls.rtsp,
                },
                token,
                expiresIn: 3600, // 1 hour in seconds
                cameraId: camera.id,
                cameraName: `Camera ${camera.position + 1}`,
                streamInfo: streamInfo || undefined,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
}

export async function validateStreamToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { cameraId } = req.params;
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_TOKEN', message: 'Token is required' },
                timestamp: new Date().toISOString(),
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as StreamTokenPayload;

            if (decoded.cameraId !== cameraId) {
                return res.status(403).json({
                    success: false,
                    error: { code: 'INVALID_TOKEN', message: 'Token does not match camera' },
                    timestamp: new Date().toISOString(),
                });
            }

            res.json({
                success: true,
                data: { valid: true, cameraId: decoded.cameraId },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: { code: 'EXPIRED_TOKEN', message: 'Token has expired' },
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        next(error);
    }
}
