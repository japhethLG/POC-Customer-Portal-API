/**
 * Job Controller
 *
 * Thin controller that delegates to JobService.
 * Handles HTTP concerns only (request/response).
 */

import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { jobService } from '../services/job.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

export class JobController {
  /**
   * Create a new job/booking
   * POST /api/jobs
   */
  static createJob = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const customerId = req.customerId!.toString();
    const customer = req.customer!;
    const { job_address, job_description, scheduled_date, status } = req.body;

    const job = await jobService.createJob(
      { job_address, job_description, scheduled_date, status },
      customerId,
      customer
    );

    sendCreated(res, job, 'Job created successfully');
  });

  /**
   * Update an existing job
   * PUT /api/jobs/:id
   */
  static updateJob = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params; // This is now the ServiceM8 UUID
    const customerId = req.customerId!.toString();
    const customer = req.customer!;
    const { job_address, job_description, scheduled_date, status } = req.body;

    const job = await jobService.updateJob(
      id,
      { job_address, job_description, scheduled_date, status },
      customerId,
      customer
    );

    sendSuccess(res, job, 200, 'Job updated successfully');
  });

  /**
   * Delete a job
   * DELETE /api/jobs/:id
   */
  static deleteJob = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params; // This is now the ServiceM8 UUID
    const customerId = req.customerId!.toString();
    const customer = req.customer!;

    await jobService.deleteJob(id, customerId, customer);

    sendSuccess(res, undefined, 200, 'Job deleted successfully');
  });
}
