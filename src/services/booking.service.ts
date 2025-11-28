/**
 * Booking Service
 *
 * Handles all booking-related business logic including
 * fetching bookings with caching, ServiceM8 sync, and attachments.
 */

import { Types } from 'mongoose';
import { servicem8Service } from './servicem8.service';
import { jobRepository } from '../repositories/job.repository';
import { attachmentRepository } from '../repositories/attachment.repository';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import { ICustomer, IJob, IAttachment } from '../types';

/**
 * Booking summary for list view
 */
export interface BookingSummary {
  id: Types.ObjectId;
  servicem8Uuid: string;
  jobNumber?: string;
  status?: string;
  address?: string;
  description?: string;
  scheduledDate?: Date;
  contactName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Attachment summary
 */
export interface AttachmentSummary {
  id: Types.ObjectId;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Booking detail with attachments
 */
export interface BookingDetail extends BookingSummary {
  contactEmail?: string;
  contactPhone?: string;
  attachments: AttachmentSummary[];
}

/**
 * Result from fetching all bookings
 */
export interface BookingsResult {
  bookings: BookingSummary[];
  cached: boolean;
}

class BookingService {
  /**
   * Cache duration in minutes
   */
  private readonly CACHE_DURATION_MINUTES = 5;

  /**
   * Get all bookings for a customer with caching
   *
   * @param customerId - Customer ID
   * @param customer - Customer document for email/phone matching
   * @returns Bookings result with cache status
   */
  async getAllBookings(
    customerId: Types.ObjectId,
    customer: ICustomer
  ): Promise<BookingsResult> {
    logger.info('Fetching bookings for customer', { 
      customerId,
      email: customer.email 
    });

    // Check if cache is fresh (updated within last 5 minutes)
    const cachedJobs = await jobRepository.findRecentJobs(
      customerId,
      this.CACHE_DURATION_MINUTES
    );

    // If we have fresh cached data, return it
    if (cachedJobs.length > 0) {
      logger.info('Returning cached bookings', { count: cachedJobs.length });
      return {
        bookings: cachedJobs.map(job => this.mapJobToSummary(job)),
        cached: true,
      };
    }

    // Fetch fresh data from ServiceM8
    logger.info('Fetching fresh data from ServiceM8');
    const allJobs = await servicem8Service.getAllJobs();

    // Filter jobs for this customer
    const customerJobs = servicem8Service.matchJobsToCustomer(
      allJobs,
      customer.email || '',
      customer.phone || ''
    );

    logger.info('Found jobs for customer in ServiceM8', { 
      count: customerJobs.length 
    });

    // Update or create jobs in database
    const savedJobs = await this.syncJobsToDatabase(customerJobs, customerId);

    return {
      bookings: savedJobs.map(job => this.mapJobToSummary(job)),
      cached: false,
    };
  }

  /**
   * Get a specific booking by ID with fresh data from ServiceM8
   *
   * @param bookingId - Booking/Job ID
   * @param customerId - Customer ID for ownership verification
   * @returns Booking detail with attachments
   * @throws NotFoundError if booking not found
   */
  async getBookingById(
    bookingId: string,
    customerId: Types.ObjectId
  ): Promise<BookingDetail> {
    // Fetch job from database
    const job = await jobRepository.findOne({ _id: bookingId, customerId });

    if (!job) {
      throw new NotFoundError('Booking');
    }

    // Fetch fresh data from ServiceM8
    logger.info('Fetching fresh job data from ServiceM8', { 
      servicem8Uuid: job.servicem8Uuid 
    });

    const freshJob = await servicem8Service.getJobByUuid(job.servicem8Uuid);

    if (freshJob) {
      // Update job data in database
      await jobRepository.update(job._id.toString(), {
        status: freshJob.status,
        jobAddress: freshJob.job_address,
        jobDescription: freshJob.job_description,
        scheduledDate: freshJob.scheduled_date 
          ? new Date(freshJob.scheduled_date) 
          : undefined,
        rawData: freshJob,
      });

      // Update local job object for response
      job.status = freshJob.status;
      job.jobAddress = freshJob.job_address;
      job.jobDescription = freshJob.job_description;
      job.scheduledDate = freshJob.scheduled_date 
        ? new Date(freshJob.scheduled_date) 
        : undefined;
      job.rawData = freshJob;
    }

    // Fetch attachments
    const attachments = await this.getJobAttachments(job);

    return {
      ...this.mapJobToSummary(job),
      contactEmail: job.contactEmail,
      contactPhone: job.contactPhone,
      attachments: attachments.map(att => this.mapAttachmentToSummary(att)),
    };
  }

  /**
   * Sync jobs from ServiceM8 to database
   *
   * @param servicem8Jobs - Jobs from ServiceM8
   * @param customerId - Customer ID
   * @returns Saved jobs
   */
  private async syncJobsToDatabase(
    servicem8Jobs: any[],
    customerId: Types.ObjectId
  ): Promise<IJob[]> {
    const savedJobsWithNulls = await Promise.all(
      servicem8Jobs.map(async (job) => {
        const jobData = {
          servicem8Uuid: job.uuid,
          customerId,
          jobNumber: job.generated_job_id,
          status: job.status,
          jobAddress: job.job_address,
          jobDescription: job.job_description,
          scheduledDate: job.scheduled_date 
            ? new Date(job.scheduled_date) 
            : undefined,
          contactName: job.job_contact_name,
          contactEmail: job.job_contact_email,
          contactPhone: job.job_contact_mobile,
          rawData: job,
        };

        return await jobRepository.upsertByServiceM8Uuid(job.uuid, jobData);
      })
    );

    // Filter out any null values
    return savedJobsWithNulls.filter((job): job is IJob => job !== null);
  }

  /**
   * Get attachments for a job, fetching from ServiceM8 if not cached
   *
   * @param job - Job document
   * @returns Array of attachments
   */
  private async getJobAttachments(job: IJob): Promise<IAttachment[]> {
    // Check for cached attachments
    const cachedAttachments = await attachmentRepository.findByJobId(job._id);

    if (cachedAttachments.length > 0) {
      return cachedAttachments;
    }

    // Fetch from ServiceM8
    logger.info('Fetching attachments from ServiceM8', { 
      jobId: job._id,
      servicem8Uuid: job.servicem8Uuid 
    });

    const servicem8Attachments = await servicem8Service.getJobAttachments(
      job.servicem8Uuid
    );

    // Save attachments to database
    const attachmentsWithNulls = await Promise.all(
      servicem8Attachments.map(async (att: any) => {
        return await attachmentRepository.upsert(job._id, {
          servicem8Uuid: att.uuid,
          fileName: att.file_name,
          fileType: att.file_type || att.content_type,
          fileUrl: att.file,
          thumbnailUrl: att.file, // ServiceM8 doesn't provide separate thumbnails
        });
      })
    );

    // Filter out any null values
    return attachmentsWithNulls.filter((att): att is IAttachment => att !== null);
  }

  /**
   * Map job document to booking summary
   */
  private mapJobToSummary(job: IJob): BookingSummary {
    return {
      id: job._id,
      servicem8Uuid: job.servicem8Uuid,
      jobNumber: job.jobNumber,
      status: job.status,
      address: job.jobAddress,
      description: job.jobDescription,
      scheduledDate: job.scheduledDate,
      contactName: job.contactName,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Map attachment document to attachment summary
   */
  private mapAttachmentToSummary(attachment: IAttachment): AttachmentSummary {
    return {
      id: attachment._id,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileUrl: attachment.fileUrl,
      thumbnailUrl: attachment.thumbnailUrl,
    };
  }
}

// Export singleton instance
export const bookingService = new BookingService();

