import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All message routes require authentication
router.use(authMiddleware);

// GET /api/messages/:jobId
router.get('/:jobId', MessageController.getMessages);

// POST /api/messages/:jobId
router.post('/:jobId', MessageController.sendMessage);

export default router;

