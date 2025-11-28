/**
 * Job Service
 *
 * Handles all job-related business logic directly with ServiceM8.
 * No local database storage - all data fetched in real-time.
 */

import { servicem8Service } from './servicem8.service';
import { logger } from '../utils/logger';
import {
  NotFoundError,
  JobCreationError,
  JobUpdateError,
  JobDeletionError,
  ForbiddenError,
} from '../utils/errors';
import { ICustomer, ServiceM8Job } from '../types';

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
  id: string;
  servicem8Uuid: string;
  jobNumber?: string;
  status?: string;
  address?: string;
  description?: string;
  scheduledDate?: string;
}

class JobService {
  /**
   * Create a new job in ServiceM8
   *
   * @param input - Job creation data
   * @param customerId - Customer ID (for logging)
   * @param customer - Customer document
   * @returns Created job
   * @throws JobCreationError if ServiceM8 creation fails
   */
  async createJob(
    input: CreateJobInput,
    customerId: string,
    customer: ICustomer
  ): Promise<JobResult> {
    const { job_address, job_description, scheduled_date, status } = input;

    logger.info('Creating job for customer', { 
      customerId,
      email: customer.email, 
      phone: customer.phone 
    });

    // Ensure customer has a ServiceM8 company UUID
    let companyUuid = customer.servicem8ClientUuid;
    if (!companyUuid) {
      logger.warn('Customer missing servicem8ClientUuid, creating company now', { 
        customerId 
      });
      
      try {
        const companyName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 
                            customer.email || 
                            customer.phone || 
                            'Customer';
        
        const company = await servicem8Service.createCompany({
          name: companyName,
          email: customer.email,
          mobile: customer.phone,
          address: customer.address,
        });
        
        companyUuid = company.uuid;
        
        // Update customer record with the UUID
        customer.servicem8ClientUuid = companyUuid;
        await customer.save();
        
        logger.info('Created ServiceM8 company for existing customer', { 
          customerId,
          companyUuid 
        });
      } catch (error: any) {
        logger.error('Failed to create company for existing customer', { 
          error: error.message 
        });
        throw new JobCreationError('Failed to create customer account in ServiceM8');
      }
    }

    // Create job in ServiceM8
    let servicem8Job: ServiceM8Job;
    try {
      servicem8Job = await servicem8Service.createJob({
        job_address,
        job_description,
        scheduled_date,
        status: status || 'Quote',
        company_uuid: companyUuid,
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

    return this.mapServiceM8JobToResult(servicem8Job);
  }

  /**
   * Update an existing job in ServiceM8
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param input - Update data
   * @param customerId - Customer ID for logging
   * @param customer - Customer document for ownership verification
   * @returns Updated job
   * @throws NotFoundError if job not found
   * @throws ForbiddenError if customer doesn't own the job
   * @throws JobUpdateError if update fails
   */
  async updateJob(
    jobUuid: string,
    input: UpdateJobInput,
    customerId: string,
    customer: ICustomer
  ): Promise<JobResult> {
    const { job_address, job_description, scheduled_date, status } = input;

    // Fetch job from ServiceM8 to verify ownership
    const job = await servicem8Service.getJobByUuid(jobUuid);
    if (!job) {
      throw new NotFoundError('Job');
    }

    // Check if job is active
    if (job.active === 0) {
      throw new NotFoundError('Job');
    }

    // Verify customer owns this job
    if (job.company_uuid !== customer.servicem8ClientUuid) {
      logger.warn('Customer attempted to update job they do not own', {
        customerId,
        jobUuid,
        jobCompanyUuid: job.company_uuid,
        customerCompanyUuid: customer.servicem8ClientUuid
      });
      throw new ForbiddenError('You do not have permission to update this job');
    }

    logger.info('Updating job', { 
      customerId,
      jobUuid
    });

    // Build update payload (only include provided fields)
    const updateData: any = {};
    if (job_address) updateData.job_address = job_address;
    if (job_description) updateData.job_description = job_description;
    if (scheduled_date) updateData.scheduled_date = scheduled_date;
    if (status) updateData.status = status;

    // Update job in ServiceM8
    let servicem8Job: ServiceM8Job;
    try {
      servicem8Job = await servicem8Service.updateJob(jobUuid, updateData);
      logger.info('Updated job in ServiceM8', { uuid: servicem8Job.uuid });
    } catch (error: any) {
      logger.error('Failed to update job in ServiceM8', { error: error.message });
      throw new JobUpdateError('Failed to update job in ServiceM8');
    }

    return this.mapServiceM8JobToResult(servicem8Job);
  }

  /**
   * Delete a job (cancel in ServiceM8)
   *
   * @param jobUuid - ServiceM8 Job UUID
   * @param customerId - Customer ID for logging
   * @param customer - Customer document for ownership verification
   * @throws NotFoundError if job not found
   * @throws ForbiddenError if customer doesn't own the job
   * @throws JobDeletionError if cancellation fails
   */
  async deleteJob(jobUuid: string, customerId: string, customer: ICustomer): Promise<void> {
    // Fetch job from ServiceM8 to verify ownership
    const job = await servicem8Service.getJobByUuid(jobUuid);
    if (!job) {
      throw new NotFoundError('Job');
    }

    // Check if job is already inactive
    if (job.active === 0) {
      throw new NotFoundError('Job');
    }

    // Verify customer owns this job
    if (job.company_uuid !== customer.servicem8ClientUuid) {
      logger.warn('Customer attempted to delete job they do not own', {
        customerId,
        jobUuid,
        jobCompanyUuid: job.company_uuid,
        customerCompanyUuid: customer.servicem8ClientUuid
      });
      throw new ForbiddenError('You do not have permission to delete this job');
    }

    logger.info('Deleting job', { 
      customerId,
      jobUuid
    });

    // Deactivate job in ServiceM8 by setting active to 0
    // This is the proper way to delete/cancel jobs in ServiceM8
    try {
      await servicem8Service.updateJob(jobUuid, {
        active: 0,
      });
      logger.info('Deactivated job in ServiceM8', { jobUuid });
    } catch (error: any) {
      logger.error('Failed to deactivate job in ServiceM8', { 
        jobUuid,
        error: error.message 
      });
      throw new JobDeletionError('Failed to deactivate job in ServiceM8');
    }
  }

  /**
   * Map ServiceM8 job to job result
   */
  private mapServiceM8JobToResult(job: ServiceM8Job): JobResult {
    return {
      id: job.uuid,
      servicem8Uuid: job.uuid,
      jobNumber: job.generated_job_id,
      status: job.status,
      address: job.job_address,
      description: job.job_description,
      scheduledDate: job.scheduled_date,
    };
  }
}

// Export singleton instance
export const jobService = new JobService();
