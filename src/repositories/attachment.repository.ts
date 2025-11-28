/**
 * Attachment Repository
 *
 * Data access layer for Attachment model
 */

import { Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import { Attachment } from '../models/Attachment.model';
import { IAttachment } from '../types';

export class AttachmentRepository extends BaseRepository<IAttachment> {
  constructor() {
    super(Attachment);
  }

  /**
   * Find all attachments for a job
   *
   * @param jobId - Job ID
   * @returns Array of attachments
   */
  async findByJobId(jobId: string | Types.ObjectId): Promise<IAttachment[]> {
    return this.find({ jobId });
  }

  /**
   * Find attachment by ServiceM8 UUID
   *
   * @param uuid - ServiceM8 attachment UUID
   * @returns Attachment or null if not found
   */
  async findByServiceM8Uuid(uuid: string): Promise<IAttachment | null> {
    return this.findOne({ servicem8Uuid: uuid });
  }

  /**
   * Create or update attachment
   *
   * @param jobId - Job ID
   * @param attachmentData - Attachment data
   * @returns Created or updated attachment
   */
  async upsert(jobId: string | Types.ObjectId, attachmentData: Partial<IAttachment>): Promise<IAttachment | null> {
    if (!attachmentData.servicem8Uuid) {
      throw new Error('ServiceM8 UUID is required for upsert');
    }

    return this.model
      .findOneAndUpdate(
        { servicem8Uuid: attachmentData.servicem8Uuid },
        { $set: { ...attachmentData, jobId } },
        { upsert: true, new: true, runValidators: true }
      )
      .exec();
  }

  /**
   * Delete all attachments for a job
   *
   * @param jobId - Job ID
   * @returns Number of deleted attachments
   */
  async deleteByJobId(jobId: string | Types.ObjectId): Promise<number> {
    const result = await this.model.deleteMany({ jobId }).exec();
    return result.deletedCount || 0;
  }
}

// Export singleton instance
export const attachmentRepository = new AttachmentRepository();
