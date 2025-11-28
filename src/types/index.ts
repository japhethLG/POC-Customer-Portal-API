import { Request } from 'express';
import { Document, Types } from 'mongoose';

// Customer Types
export interface ICustomer extends Document {
  _id: Types.ObjectId;
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  servicem8ClientUuid: string; // ServiceM8 Company/Contact UUID (required)
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Message Types
export interface IMessage extends Document {
  _id: Types.ObjectId;
  jobUuid: string; // ServiceM8 Job UUID
  customerId: Types.ObjectId;
  message: string;
  senderType: 'customer' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

// Session Types
export interface ISession extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Types
export interface AuthRequest extends Request {
  customer?: ICustomer;
  customerId?: Types.ObjectId;
}

export interface TokenPayload {
  customerId: string;
  email: string;
}

// ServiceM8 API Types
export interface ServiceM8Job {
  uuid: string;
  active: number;
  status: string;
  job_address?: string;
  job_description?: string;
  job_contact_name?: string;
  job_contact_mobile?: string;
  job_contact_email?: string;
  generated_job_id?: string;
  scheduled_date?: string;
  edit_date?: string;
  company_uuid?: string;
  [key: string]: any;
}

export interface ServiceM8Company {
  uuid: string;
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  [key: string]: any;
}

export interface CreateJobPayload {
  job_address: string;
  job_description: string;
  scheduled_date?: string;
  status?: string;
  company_uuid?: string;
  active?: number;
}

export interface ServiceM8Attachment {
  uuid: string;
  related_object: string;
  related_object_uuid: string;
  file_name: string;
  file_type?: string;
  content_type?: string;
  file?: string;
  [key: string]: any;
}

