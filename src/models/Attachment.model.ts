import { Schema, model } from 'mongoose';
import { IAttachment } from '../types';

const attachmentSchema = new Schema<IAttachment>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    servicem8Uuid: String,
    fileName: String,
    fileType: String,
    fileUrl: String,
    thumbnailUrl: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
attachmentSchema.index({ jobId: 1 });

export const Attachment = model<IAttachment>('Attachment', attachmentSchema);

