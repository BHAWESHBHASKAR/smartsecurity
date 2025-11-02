import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as cameraController from '../controllers/camera.controller';
import { validateRequest, createCameraSchema } from '../lib/validation';

const router = Router();

router.use(authenticate);

router.get('/', cameraController.getCameras);
router.get('/:id', cameraController.getCameraById);
router.patch('/:id/status', cameraController.updateCameraStatus);
router.post('/', validateRequest(createCameraSchema), cameraController.createCamera);
router.delete('/:id', cameraController.deleteCamera);

export default router;
