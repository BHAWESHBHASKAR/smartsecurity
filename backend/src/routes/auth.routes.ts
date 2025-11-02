import { Router } from 'express';
import { validateRequest, loginSchema, registerSchema } from '../lib/validation';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
