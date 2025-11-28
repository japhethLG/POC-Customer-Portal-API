import { Schema, model } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>(
  {
    jobUuid: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    senderType: {
      type: String,
      enum: ['customer', 'system'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
messageSchema.index({ jobUuid: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);

