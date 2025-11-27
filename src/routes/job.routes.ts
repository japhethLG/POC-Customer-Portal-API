import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

// POST /api/jobs - Create new job
router.post('/', JobController.createJob);

// PUT /api/jobs/:id - Update existing job
router.put('/:id', JobController.updateJob);

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', JobController.deleteJob);

export default router;

