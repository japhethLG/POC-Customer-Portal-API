import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { ServiceM8Job, ServiceM8Attachment, ServiceM8Company, CreateJobPayload } from '../types';

class ServiceM8Service {
  private client: AxiosInstance;
  private readonly baseURL = 'https://api.servicem8.com/api_1.0';

  constructor() {
    // Create Basic Auth token
    const auth = Buffer.from(
      `${config.servicem8Email}:${config.servicem8ApiToken}`
    ).toString('base64');

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      console.log(`🔵 ServiceM8 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ ServiceM8 API Success: ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        console.error(
          `❌ ServiceM8 API Error: ${error.config?.url} - ${error.response?.status || error.message}`
        );
        throw error;
      }
    );
  }

  /**
   * Fetch all jobs from ServiceM8
   */
  async getAllJobs(): Promise<ServiceM8Job[]> {
    try {
      const response = await this.client.get<ServiceM8Job[]>('/job.json');
      console.log(`📋 Fetched ${response.data.length} jobs from ServiceM8`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching jobs from ServiceM8:', error.message);
      throw new Error('Failed to fetch jobs from ServiceM8');
    }
  }

  /**
   * Fetch a specific job by UUID from ServiceM8
   */
  async getJobByUuid(uuid: string): Promise<ServiceM8Job | null> {
    try {
      const response = await this.client.get<ServiceM8Job>(`/job/${uuid}.json`);
      console.log(`📄 Fetched job ${uuid} from ServiceM8`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`Job ${uuid} not found in ServiceM8`);
        return null;
      }
      console.error(`Error fetching job ${uuid} from ServiceM8:`, error.message);
      throw new Error('Failed to fetch job from ServiceM8');
    }
  }

  /**
   * Fetch attachments for a specific job from ServiceM8
   */
  async getJobAttachments(jobUuid: string): Promise<ServiceM8Attachment[]> {
    try {
      const response = await this.client.get<ServiceM8Attachment[]>(
        `/attachment.json`,
        {
          params: {
            'related_object': 'job',
            'related_object_uuid': jobUuid,
          },
        }
      );
      console.log(`📎 Fetched ${response.data.length} attachments for job ${jobUuid}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching attachments for job ${jobUuid}:`, error.message);
      // Return empty array instead of throwing - attachments are optional
      return [];
    }
  }

  /**
   * Get job activity/notes for a specific job from ServiceM8
   */
  async getJobActivity(jobUuid: string): Promise<any[]> {
    try {
      const response = await this.client.get('/jobactivity.json', {
        params: {
          'job_uuid': jobUuid,
        },
      });
      console.log(`💬 Fetched ${response.data.length} activities for job ${jobUuid}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching job activity for ${jobUuid}:`, error.message);
      // Return empty array instead of throwing - activity is optional
      return [];
    }
  }

  /**
   * Test connection to ServiceM8 API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/company.json');
      console.log('✅ ServiceM8 API connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ ServiceM8 API connection failed:', error.message);
      return false;
    }
  }

  /**
   * Match a customer to ServiceM8 jobs by email or phone
   */
  matchJobsToCustomer(jobs: ServiceM8Job[], email: string, phone: string): ServiceM8Job[] {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits

    return jobs.filter((job) => {
      const jobEmail = job.job_contact_email?.toLowerCase().trim();
      const jobPhone = job.job_contact_mobile?.replace(/\D/g, '');

      // Match by email or phone
      const emailMatch = jobEmail && jobEmail === normalizedEmail;
      const phoneMatch = jobPhone && jobPhone.includes(normalizedPhone);

      return emailMatch || phoneMatch;
    });
  }

  /**
   * Create a new company/contact in ServiceM8
   */
  async createCompany(companyData: {
    name: string;
    email?: string;
    mobile?: string;
    address?: string;
  }): Promise<ServiceM8Company> {
    try {
      const response = await this.client.post<ServiceM8Company>('/company.json', {
        name: companyData.name,
        email: companyData.email,
        mobile: companyData.mobile,
        address: companyData.address,
        active: 1,
      });
      console.log(`✅ Created company in ServiceM8: ${response.data.uuid}`);
      return response.data;
    } catch (error: any) {
      console.error('Error creating company in ServiceM8:', error.message);
      throw new Error('Failed to create company in ServiceM8');
    }
  }

  /**
   * Get a company by UUID from ServiceM8
   */
  async getCompanyByUuid(uuid: string): Promise<ServiceM8Company | null> {
    try {
      const response = await this.client.get<ServiceM8Company>(`/company/${uuid}.json`);
      console.log(`📄 Fetched company ${uuid} from ServiceM8`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`Company ${uuid} not found in ServiceM8`);
        return null;
      }
      console.error(`Error fetching company ${uuid} from ServiceM8:`, error.message);
      throw new Error('Failed to fetch company from ServiceM8');
    }
  }

  /**
   * Create a new job in ServiceM8
   */
  async createJob(jobData: CreateJobPayload): Promise<ServiceM8Job> {
    try {
      const payload: any = {
        job_address: jobData.job_address,
        job_description: jobData.job_description,
        status: jobData.status || 'Quote',
        active: 1,
      };

      if (jobData.company_uuid) {
        payload.company_uuid = jobData.company_uuid;
      }

      if (jobData.scheduled_date) {
        payload.scheduled_date = jobData.scheduled_date;
      }

      const response = await this.client.post<ServiceM8Job>('/job.json', payload);
      console.log(`✅ Created job in ServiceM8: ${response.data.uuid}`);
      return response.data;
    } catch (error: any) {
      console.error('Error creating job in ServiceM8:', error.message);
      throw new Error('Failed to create job in ServiceM8');
    }
  }

  /**
   * Update an existing job in ServiceM8
   */
  async updateJob(uuid: string, jobData: Partial<CreateJobPayload>): Promise<ServiceM8Job> {
    try {
      const response = await this.client.post<ServiceM8Job>(`/job/${uuid}.json`, jobData);
      console.log(`✅ Updated job in ServiceM8: ${uuid}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error updating job ${uuid} in ServiceM8:`, error.message);
      throw new Error('Failed to update job in ServiceM8');
    }
  }
}

export const servicem8Service = new ServiceM8Service();

