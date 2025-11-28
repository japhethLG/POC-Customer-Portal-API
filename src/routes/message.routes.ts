import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  getMessagesSchema,
  sendMessageSchema,
} from '../validators/message.validator';

const router = Router();

// All message routes require authentication
router.use(authMiddleware);

// GET /api/messages/:jobId
router.get('/:jobId', validate(getMessagesSchema), MessageController.getMessages);

// POST /api/messages/:jobId
router.post('/:jobId', validate(sendMessageSchema), MessageController.sendMessage);

export default router;

