/**
 * Test Routes
 * For testing RTSP streams before adding to database
 */

import { Router } from 'express';
import { testStream, getTestStreams } from '../controllers/test.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public test endpoints (no auth required for testing)
router.post('/stream', testStream);
router.get('/streams', getTestStreams);

export default router;
