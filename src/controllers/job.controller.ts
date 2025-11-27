import { Response } from 'express';
import { AuthRequest } from '../types';
import { Job } from '../models';
import { servicem8Service } from '../services/servicem8.service';

export class JobController {
  /**
   * Create a new job/booking
   */
  static async createJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customerId = req.customerId;
      const customer = req.customer!;
      const { job_address, job_description, scheduled_date, status } = req.body;

      // Validate input
      if (!job_address || !job_description) {
        res.status(400).json({
          success: false,
          message: 'Job address and description are required',
        });
        return;
      }

      console.log(`📝 Creating job for customer: ${customer.email || customer.phone}`);

      // Create job in ServiceM8
      let servicem8Job;
      try {
        servicem8Job = await servicem8Service.createJob({
          job_address,
          job_description,
          scheduled_date,
          status: status || 'Quote',
          company_uuid: customer.servicem8ClientUuid,
        });
        console.log(`✅ Created job in ServiceM8: ${servicem8Job.uuid}`);
      } catch (error: any) {
        console.error('Failed to create job in ServiceM8:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to create job in ServiceM8',
        });
        return;
      }

      // Save job in our database
      const job = await Job.create({
        servicem8Uuid: servicem8Job.uuid,
        customerId,
        jobNumber: servicem8Job.generated_job_id,
        status: servicem8Job.status,
        jobAddress: servicem8Job.job_address,
        jobDescription: servicem8Job.job_description,
        scheduledDate: servicem8Job.scheduled_date ? new Date(servicem8Job.scheduled_date) : undefined,
        contactName: servicem8Job.job_contact_name,
        contactEmail: servicem8Job.job_contact_email || customer.email,
        contactPhone: servicem8Job.job_contact_mobile || customer.phone,
        rawData: servicem8Job,
      });

      console.log(`✅ Job saved to database: ${job._id}`);

      res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: {
          id: job._id,
          servicem8Uuid: job.servicem8Uuid,
          jobNumber: job.jobNumber,
          status: job.status,
          address: job.jobAddress,
          description: job.jobDescription,
          scheduledDate: job.scheduledDate,
          createdAt: job.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Create job error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create job',
      });
    }
  }

  /**
   * Update an existing job
   */
  static async updateJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerId = req.customerId;
      const { job_address, job_description, scheduled_date, status } = req.body;

      // Find job and verify ownership
      const job = await Job.findOne({ _id: id, customerId });
      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found',
        });
        return;
      }

      console.log(`📝 Updating job: ${job.servicem8Uuid}`);

      // Update job in ServiceM8
      const updateData: any = {};
      if (job_address) updateData.job_address = job_address;
      if (job_description) updateData.job_description = job_description;
      if (scheduled_date) updateData.scheduled_date = scheduled_date;
      if (status) updateData.status = status;

      try {
        const servicem8Job = await servicem8Service.updateJob(
          job.servicem8Uuid,
          updateData
        );
        console.log(`✅ Updated job in ServiceM8: ${servicem8Job.uuid}`);

        // Update in our database
        job.status = servicem8Job.status;
        job.jobAddress = servicem8Job.job_address;
        job.jobDescription = servicem8Job.job_description;
        job.scheduledDate = servicem8Job.scheduled_date ? new Date(servicem8Job.scheduled_date) : undefined;
        job.rawData = servicem8Job;
        await job.save();

        res.json({
          success: true,
          message: 'Job updated successfully',
          data: {
            id: job._id,
            servicem8Uuid: job.servicem8Uuid,
            jobNumber: job.jobNumber,
            status: job.status,
            address: job.jobAddress,
            description: job.jobDescription,
            scheduledDate: job.scheduledDate,
            updatedAt: job.updatedAt,
          },
        });
      } catch (error: any) {
        console.error('Failed to update job in ServiceM8:', error.message);
        res.status(500).json({
          success: false,
          message: 'Failed to update job in ServiceM8',
        });
      }
    } catch (error: any) {
      console.error('Update job error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job',
      });
    }
  }

  /**
   * Delete a job
   */
  static async deleteJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerId = req.customerId;

      // Find job and verify ownership
      const job = await Job.findOne({ _id: id, customerId });
      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job not found',
        });
        return;
      }

      console.log(`🗑️ Deleting job: ${job.servicem8Uuid}`);

      // In ServiceM8, we typically set active=0 instead of deleting
      try {
        await servicem8Service.updateJob(job.servicem8Uuid, {
          status: 'Cancelled',
        });
        console.log(`✅ Cancelled job in ServiceM8: ${job.servicem8Uuid}`);
      } catch (error: any) {
        console.warn('Failed to cancel job in ServiceM8:', error.message);
        // Continue with local deletion even if ServiceM8 fails
      }

      // Delete from our database
      await Job.deleteOne({ _id: id });

      res.json({
        success: true,
        message: 'Job deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete job error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete job',
      });
    }
  }
}

