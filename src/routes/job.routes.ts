import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { jobCreationRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  createJobSchema,
  updateJobSchema,
  deleteJobSchema,
} from '../validators/job.validator';

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

// POST /api/jobs - Create new job
router.post('/', jobCreationRateLimiter, validate(createJobSchema), JobController.createJob);

// PUT /api/jobs/:id - Update existing job
router.put('/:id', validate(updateJobSchema), JobController.updateJob);

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', validate(deleteJobSchema), JobController.deleteJob);

export default router;

