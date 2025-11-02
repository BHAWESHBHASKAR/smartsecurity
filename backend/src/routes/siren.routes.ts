import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as sirenController from '../controllers/siren.controller';

const router = Router();

router.get('/device-status', sirenController.getSirenStatusForDevice);

router.use(authenticate);

router.post('/toggle', sirenController.toggleSiren);
router.get('/logs/:storeId', sirenController.getSirenLogs);

export default router;
