import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register - Register new customer
router.post('/register', AuthController.register);

// POST /api/auth/login - Login with email/phone + password
router.post('/login', AuthController.login);

// POST /api/auth/logout - Logout and invalidate session
router.post('/logout', AuthController.logout);

// GET /api/auth/me - Get current customer info
router.get('/me', authMiddleware, AuthController.me);

export default router;

