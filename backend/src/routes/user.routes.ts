import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest, createUserSchema, updateUserSchema, setupSchema } from '../lib/validation';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getCurrentUser);
router.post('/setup', requireRole('CLIENT'), validateRequest(setupSchema), userController.setupStore);
router.get('/list', requireRole('ADMIN'), userController.listUsers);
router.post('/', requireRole('ADMIN'), validateRequest(createUserSchema), userController.createUser);
router.put('/:id', requireRole('ADMIN'), validateRequest(updateUserSchema), userController.updateUser);
router.delete('/:id', requireRole('ADMIN'), userController.deleteUser);

export default router;
