import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { registerSchema, loginSchema, logoutSchema } from '../validators/auth.validator';

const router = Router();

// POST /api/auth/register - Register new customer
router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);

// POST /api/auth/login - Login with email/phone + password
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);

// POST /api/auth/logout - Logout and invalidate session
router.post('/logout', authMiddleware, validate(logoutSchema), AuthController.logout);

// GET /api/auth/me - Get current customer info
router.get('/me', authMiddleware, AuthController.me);

export default router;

