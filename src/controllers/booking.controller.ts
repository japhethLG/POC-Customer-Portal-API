import { Response } from 'express';
import { AuthRequest } from '../types';
import { Job, Attachment } from '../models';
import { servicem8Service } from '../services/servicem8.service';

export class BookingController {
  /**
   * Get all bookings for the authenticated customer
   */
  static async getAllBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.customerId;
      const customer = req.customer!;

      console.log(`📋 Fetching bookings for customer: ${customer.email}`);

      // Check if cache is fresh (updated within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const cachedJobs = await Job.find({
        customerId,
        updatedAt: { $gte: fiveMinutesAgo },
      }).sort({ scheduledDate: -1 });

      // If we have fresh cached data, return it
      if (cachedJobs.length > 0) {
        console.log(`✅ Returning ${cachedJobs.length} cached bookings`);
        res.json({
          success: true,
          data: cachedJobs.map(job => ({
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
          })),
          cached: true,
        });
        return;
      }

      // Fetch fresh data from ServiceM8
      console.log('🔄 Fetching fresh data from ServiceM8...');
      const allJobs = await servicem8Service.getAllJobs();

      // Filter jobs for this customer
      const customerJobs = servicem8Service.matchJobsToCustomer(
        allJobs,
        customer.email,
        customer.phone
      );

      console.log(`✅ Found ${customerJobs.length} jobs for customer`);

      // Update or create jobs in database
      const savedJobs = await Promise.all(
        customerJobs.map(async (job) => {
          const jobData = {
            servicem8Uuid: job.uuid,
            customerId,
            jobNumber: job.generated_job_id,
            status: job.status,
            jobAddress: job.job_address,
            jobDescription: job.job_description,
            scheduledDate: job.scheduled_date ? new Date(job.scheduled_date) : undefined,
            contactName: job.job_contact_name,
            contactEmail: job.job_contact_email,
            contactPhone: job.job_contact_mobile,
            rawData: job,
          };

          return await Job.findOneAndUpdate(
            { servicem8Uuid: job.uuid },
            jobData,
            { upsert: true, new: true }
          );
        })
      );

      res.json({
        success: true,
        data: savedJobs.map(job => ({
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
        })),
        cached: false,
      });
    } catch (error: any) {
      console.error('Get bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
      });
    }
  }

  /**
   * Get a specific booking by ID
   */
  static async getBookingById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerId = req.customerId;

      // Fetch job from database
      const job = await Job.findOne({ _id: id, customerId });

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
        return;
      }

      // Fetch fresh data from ServiceM8
      console.log(`🔄 Fetching fresh job data from ServiceM8: ${job.servicem8Uuid}`);
      const freshJob = await servicem8Service.getJobByUuid(job.servicem8Uuid);

      if (freshJob) {
        // Update job data
        job.status = freshJob.status;
        job.jobAddress = freshJob.job_address;
        job.jobDescription = freshJob.job_description;
        job.scheduledDate = freshJob.scheduled_date ? new Date(freshJob.scheduled_date) : undefined;
        job.rawData = freshJob;
        await job.save();
      }

      // Fetch attachments
      const cachedAttachments = await Attachment.find({ jobId: job._id });

      // If no cached attachments or old cache, fetch from ServiceM8
      let attachments = cachedAttachments;
      if (cachedAttachments.length === 0) {
        console.log('🔄 Fetching attachments from ServiceM8...');
        const servicem8Attachments = await servicem8Service.getJobAttachments(job.servicem8Uuid);

        // Save attachments to database
        attachments = await Promise.all(
          servicem8Attachments.map(async (att) => {
            return await Attachment.findOneAndUpdate(
              { servicem8Uuid: att.uuid },
              {
                jobId: job._id,
                servicem8Uuid: att.uuid,
                fileName: att.file_name,
                fileType: att.file_type || att.content_type,
                fileUrl: att.file,
                thumbnailUrl: att.file, // ServiceM8 doesn't provide separate thumbnails
              },
              { upsert: true, new: true }
            );
          })
        );
      }

      res.json({
        success: true,
        data: {
          id: job._id,
          servicem8Uuid: job.servicem8Uuid,
          jobNumber: job.jobNumber,
          status: job.status,
          address: job.jobAddress,
          description: job.jobDescription,
          scheduledDate: job.scheduledDate,
          contactName: job.contactName,
          contactEmail: job.contactEmail,
          contactPhone: job.contactPhone,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          attachments: attachments.map(att => ({
            id: att._id,
            fileName: att.fileName,
            fileType: att.fileType,
            fileUrl: att.fileUrl,
            thumbnailUrl: att.thumbnailUrl,
          })),
        },
      });
    } catch (error: any) {
      console.error('Get booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking details',
      });
    }
  }
}

