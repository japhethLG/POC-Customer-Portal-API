/**
 * Job Service
 *
 * Handles all job-related business logic including
 * CRUD operations with ServiceM8 integration and rollback logic.
 */

import { Types } from 'mongoose';
import { servicem8Service } from './servicem8.service';
import { jobRepository } from '../repositories/job.repository';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  JobCreationError,
  JobUpdateError,
  JobDeletionError,
} from '../utils/errors';
import { ICustomer, IJob } from '../types';

/**
 * Job creation input
 */
export interface CreateJobInput {
  job_address: string;
  job_description: string;
  scheduled_date?: string;
  status?: string;
}

/**
 * Job update input
 */
export interface UpdateJobInput {
  job_address?: string;
  job_description?: string;
  scheduled_date?: string;
  status?: string;
}

/**
 * Job result for API responses
 */
export interface JobResult {
  id: Types.ObjectId;
  servicem8Uuid: string;
  jobNumber?: string;
  status?: string;
  address?: string;
  description?: string;
  scheduledDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class JobService {
  /**
   * Create a new job in ServiceM8 and local database
   *
   * This method implements a two-phase approach:
   * 1. Create job in ServiceM8
   * 2. Save job in local database
   *
   * If step 2 fails after step 1 succeeds, we log the error but
   * don't roll back ServiceM8 (job exists there, can be synced later).
   *
   * @param input - Job creation data
   * @param customerId - Customer ID
   * @param customer - Customer document
   * @returns Created job
   * @throws JobCreationError if ServiceM8 creation fails
   */
  async createJob(
    input: CreateJobInput,
    customerId: Types.ObjectId,
    customer: ICustomer
  ): Promise<JobResult> {
    const { job_address, job_description, scheduled_date, status } = input;

    logger.info('Creating job for customer', { 
      customerId,
      email: customer.email, 
      phone: customer.phone 
    });

    // Step 1: Create job in ServiceM8
    let servicem8Job;
    try {
      servicem8Job = await servicem8Service.createJob({
        job_address,
        job_description,
        scheduled_date,
        status: status || 'Quote',
        company_uuid: customer.servicem8ClientUuid,
      });
      
      logger.info('Created job in ServiceM8', { uuid: servicem8Job.uuid });
    } catch (error: any) {
      logger.error('Failed to create job in ServiceM8', { error: error.message });
      throw new JobCreationError('Failed to create job in ServiceM8');
    }

    // Validate ServiceM8 response
    if (!servicem8Job || !servicem8Job.uuid) {
      logger.error('Invalid ServiceM8 response - missing uuid', { 
        response: servicem8Job 
      });
      throw new JobCreationError('Invalid response from ServiceM8 - missing job uuid');
    }

    // Step 2: Save job in local database
    let job: IJob;
    try {
      job = await jobRepository.create({
        servicem8Uuid: servicem8Job.uuid,
        customerId,
        jobNumber: servicem8Job.generated_job_id,
        status: servicem8Job.status,
        jobAddress: servicem8Job.job_address,
        jobDescription: servicem8Job.job_description,
        scheduledDate: servicem8Job.scheduled_date 
          ? new Date(servicem8Job.scheduled_date) 
          : undefined,
        contactName: servicem8Job.job_contact_name,
        contactEmail: servicem8Job.job_contact_email || customer.email,
        contactPhone: servicem8Job.job_contact_mobile || customer.phone,
        rawData: servicem8Job,
      });

      logger.info('Job saved to database', { jobId: job._id });
    } catch (error: any) {
      // Log the error but don't fail completely - job exists in ServiceM8
      // It can be synced later through the normal booking fetch flow
      logger.error('Failed to save job to database after ServiceM8 creation', {
        servicem8Uuid: servicem8Job.uuid,
        error: error.message,
      });
      throw new JobCreationError('Job created in ServiceM8 but failed to save locally');
    }

    return this.mapJobToResult(job);
  }

  /**
   * Update an existing job in ServiceM8 and local database
   *
   * @param jobId - Job ID
   * @param input - Update data
   * @param customerId - Customer ID for ownership verification
   * @returns Updated job
   * @throws NotFoundError if job not found
   * @throws JobUpdateError if update fails
   */
  async updateJob(
    jobId: string,
    input: UpdateJobInput,
    customerId: Types.ObjectId
  ): Promise<JobResult> {
    const { job_address, job_description, scheduled_date, status } = input;

    // Find job and verify ownership
    const job = await jobRepository.findOne({ _id: jobId, customerId });
    if (!job) {
      throw new NotFoundError('Job');
    }

    logger.info('Updating job', { 
      jobId: job._id,
      servicem8Uuid: job.servicem8Uuid 
    });

    // Build update payload (only include provided fields)
    const updateData: any = {};
    if (job_address) updateData.job_address = job_address;
    if (job_description) updateData.job_description = job_description;
    if (scheduled_date) updateData.scheduled_date = scheduled_date;
    if (status) updateData.status = status;

    // Step 1: Update job in ServiceM8
    let servicem8Job;
    try {
      servicem8Job = await servicem8Service.updateJob(
        job.servicem8Uuid,
        updateData
      );
      logger.info('Updated job in ServiceM8', { uuid: servicem8Job.uuid });
    } catch (error: any) {
      logger.error('Failed to update job in ServiceM8', { error: error.message });
      throw new JobUpdateError('Failed to update job in ServiceM8');
    }

    // Step 2: Update in local database
    try {
      await jobRepository.update(job._id.toString(), {
        status: servicem8Job.status,
        jobAddress: servicem8Job.job_address,
        jobDescription: servicem8Job.job_description,
        scheduledDate: servicem8Job.scheduled_date 
          ? new Date(servicem8Job.scheduled_date) 
          : undefined,
        rawData: servicem8Job,
      });

      // Update local job object for response
      job.status = servicem8Job.status;
      job.jobAddress = servicem8Job.job_address;
      job.jobDescription = servicem8Job.job_description;
      job.scheduledDate = servicem8Job.scheduled_date 
        ? new Date(servicem8Job.scheduled_date) 
        : undefined;
      job.rawData = servicem8Job;

      logger.info('Job updated in database', { jobId: job._id });
    } catch (error: any) {
      // ServiceM8 was updated but local failed
      // Log error but return success since ServiceM8 is the source of truth
      logger.warn('Job updated in ServiceM8 but failed to update locally', {
        jobId: job._id,
        error: error.message,
      });
    }

    return this.mapJobToResult(job);
  }

  /**
   * Delete a job (cancel in ServiceM8, delete from local database)
   *
   * @param jobId - Job ID
   * @param customerId - Customer ID for ownership verification
   * @throws NotFoundError if job not found
   */
  async deleteJob(jobId: string, customerId: Types.ObjectId): Promise<void> {
    // Find job and verify ownership
    const job = await jobRepository.findOne({ _id: jobId, customerId });
    if (!job) {
      throw new NotFoundError('Job');
    }

    logger.info('Deleting job', { 
      jobId: job._id,
      servicem8Uuid: job.servicem8Uuid 
    });

    // Step 1: Cancel job in ServiceM8 (we don't actually delete, just cancel)
    try {
      await servicem8Service.updateJob(job.servicem8Uuid, {
        status: 'Cancelled',
      });
      logger.info('Cancelled job in ServiceM8', { 
        servicem8Uuid: job.servicem8Uuid 
      });
    } catch (error: any) {
      // Log warning but continue with local deletion
      logger.warn('Failed to cancel job in ServiceM8', { 
        servicem8Uuid: job.servicem8Uuid,
        error: error.message 
      });
      // Continue with local deletion even if ServiceM8 fails
    }

    // Step 2: Delete from local database
    try {
      await jobRepository.delete(jobId);
      logger.info('Job deleted from database', { jobId });
    } catch (error: any) {
      logger.error('Failed to delete job from database', {
        jobId,
        error: error.message,
      });
      throw new JobDeletionError('Failed to delete job from database');
    }
  }

  /**
   * Map job document to job result
   */
  private mapJobToResult(job: IJob): JobResult {
    return {
      id: job._id,
      servicem8Uuid: job.servicem8Uuid,
      jobNumber: job.jobNumber,
      status: job.status,
      address: job.jobAddress,
      description: job.jobDescription,
      scheduledDate: job.scheduledDate,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}

// Export singleton instance
export const jobService = new JobService();

