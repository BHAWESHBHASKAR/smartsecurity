import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest, createAlertSchema, updateAlertSchema } from '../lib/validation';
import { alertLimiter } from '../middleware/rateLimit';
import * as alertController from '../controllers/alert.controller';

const router = Router();

router.post('/webhook', alertLimiter, alertController.handleDetectionWebhook);

router.use(authenticate);

router.get('/', alertController.getAlerts);
router.get('/:id', alertController.getAlertById);
router.post('/', requireRole('ADMIN'), alertLimiter, validateRequest(createAlertSchema), alertController.createManualAlert);
router.post('/panic', alertLimiter, alertController.createPanicAlert);
router.patch('/:id/resolve', alertController.resolveAlert);

export default router;
