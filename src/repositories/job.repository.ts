/**
 * Job Repository
 *
 * Data access layer for Job model
 */

import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Job } from '../models/Job.model';
import { IJob } from '../types';

export class JobRepository extends BaseRepository<IJob> {
  constructor() {
    super(Job);
  }

  /**
   * Find all jobs for a customer
   *
   * @param customerId - Customer ID
   * @param options - Query options (limit, skip, sort)
   * @returns Array of jobs
   */
  async findByCustomerId(
    customerId: string | Types.ObjectId,
    options?: { limit?: number; skip?: number; sort?: any }
  ): Promise<IJob[]> {
    return this.find({ customerId }, options);
  }

  /**
   * Find job by ServiceM8 UUID
   *
   * @param uuid - ServiceM8 job UUID
   * @returns Job or null if not found
   */
  async findByServiceM8Uuid(uuid: string): Promise<IJob | null> {
    return this.findOne({ servicem8Uuid: uuid });
  }

  /**
   * Find recent jobs for a customer (updated within timeframe)
   *
   * @param customerId - Customer ID
   * @param minutesAgo - How many minutes ago to check
   * @returns Array of recent jobs
   */
  async findRecentJobs(
    customerId: string | Types.ObjectId,
    minutesAgo: number = 5
  ): Promise<IJob[]> {
    const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000);

    return this.find(
      {
        customerId,
        updatedAt: { $gte: timeThreshold },
      },
      {
        sort: { scheduledDate: -1 },
      }
    );
  }

  /**
   * Find or create job by ServiceM8 UUID
   *
   * @param uuid - ServiceM8 job UUID
   * @param jobData - Job data to create if not found
   * @returns Job document
   */
  async findOrCreate(uuid: string, jobData: Partial<IJob>): Promise<IJob> {
    const existingJob = await this.findByServiceM8Uuid(uuid);

    if (existingJob) {
      return existingJob;
    }

    return this.create({ ...jobData, servicem8Uuid: uuid });
  }

  /**
   * Upsert job by ServiceM8 UUID
   *
   * @param uuid - ServiceM8 job UUID
   * @param jobData - Job data
   * @returns Updated or created job
   */
  async upsertByServiceM8Uuid(uuid: string, jobData: Partial<IJob>): Promise<IJob | null> {
    return this.model
      .findOneAndUpdate(
        { servicem8Uuid: uuid },
        { $set: jobData },
        { upsert: true, new: true, runValidators: true }
      )
      .exec();
  }
}

// Export singleton instance
export const jobRepository = new JobRepository();
