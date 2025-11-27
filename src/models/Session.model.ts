import { Schema, model } from 'mongoose';
import { ISession } from '../types';

const sessionSchema = new Schema<ISession>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster token lookup and automatic cleanup
sessionSchema.index({ token: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Session = model<ISession>('Session', sessionSchema);

