import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { streamLimiter } from '../middleware/rateLimit';
import * as streamController from '../controllers/stream.controller';

const router = Router();

router.use(authenticate);

router.get('/:cameraId', streamLimiter, streamController.getStreamUrl);
router.get('/:cameraId/validate', streamController.validateStreamToken);

export default router;
