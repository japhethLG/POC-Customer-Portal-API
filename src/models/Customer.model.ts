import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ICustomer } from '../types';

const customerSchema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      sparse: true, // Allow null but unique if present
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true, // Allow null but unique if present
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    servicem8ClientUuid: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that at least email or phone is provided
customerSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('Either email or phone must be provided'));
  } else {
    next();
  }
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
customerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for faster lookups
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ servicem8ClientUuid: 1 });

export const Customer = model<ICustomer>('Customer', customerSchema);

