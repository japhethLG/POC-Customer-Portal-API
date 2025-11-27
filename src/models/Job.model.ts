import { Schema, model } from 'mongoose';
import { IJob } from '../types';

const jobSchema = new Schema<IJob>(
  {
    servicem8Uuid: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    jobNumber: String,
    status: String,
    jobAddress: String,
    jobDescription: String,
    scheduledDate: Date,
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    rawData: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
jobSchema.index({ customerId: 1 });
jobSchema.index({ servicem8Uuid: 1 });
jobSchema.index({ updatedAt: -1 });

export const Job = model<IJob>('Job', jobSchema);

