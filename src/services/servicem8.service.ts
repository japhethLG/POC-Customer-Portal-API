import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { ServiceM8Job, ServiceM8Attachment, ServiceM8Company, CreateJobPayload } from '../types';
import { logger } from '../utils/logger';

class ServiceM8Service {
  private client: AxiosInstance;
  private readonly baseURL = 'https://api.servicem8.com/api_1.0';

  constructor() {
    // Use API Key authentication as per ServiceM8 documentation
    // https://developer.servicem8.com/docs/authentication
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-API-Key': config.servicem8ApiToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      logger.debug('ServiceM8 API Request', { 
        method: config.method?.toUpperCase(), 
        url: config.url 
      });
      return config;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('ServiceM8 API Success', { 
          url: response.config.url, 
          status: response.status 
        });
        return response;
      },
      (error) => {
        logger.error('ServiceM8 API Error', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
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
      logger.info('Fetched jobs from ServiceM8', { count: response.data.length });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching jobs from ServiceM8', { error: error.message });
      throw new Error('Failed to fetch jobs from ServiceM8');
    }
  }

  /**
   * Fetch a specific job by UUID from ServiceM8
   */
  async getJobByUuid(uuid: string): Promise<ServiceM8Job | null> {
    try {
      const response = await this.client.get<ServiceM8Job>(`/job/${uuid}.json`);
      logger.debug('Fetched job from ServiceM8', { uuid });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.debug('Job not found in ServiceM8', { uuid });
        return null;
      }
      logger.error('Error fetching job from ServiceM8', { uuid, error: error.message });
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
      logger.debug('Fetched attachments for job', { 
        jobUuid, 
        count: response.data.length 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching attachments for job', { 
        jobUuid, 
        error: error.message 
      });
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
      logger.debug('Fetched activities for job', { 
        jobUuid, 
        count: response.data.length 
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching job activity', { 
        jobUuid, 
        error: error.message 
      });
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
      logger.info('ServiceM8 API connection successful');
      return true;
    } catch (error: any) {
      logger.error('ServiceM8 API connection failed', { error: error.message });
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
      logger.debug('Creating company in ServiceM8', { companyData });
      const response = await this.client.post<ServiceM8Company>('/company.json', {
        name: companyData.name,
        email: companyData.email,
        mobile: companyData.mobile,
        address: companyData.address,
        active: 1,
      });
      
      logger.debug('ServiceM8 company response', { 
        status: response.status,
        headers: response.headers,
        data: response.data 
      });
      
      // ServiceM8 might return the UUID in the Location header or x-record-uuid header
      let companyUuid = response.headers['x-record-uuid'] || response.headers['location'];
      
      // If location header contains a full URL, extract the UUID
      if (companyUuid && companyUuid.includes('/')) {
        const parts = companyUuid.split('/');
        companyUuid = parts[parts.length - 1].replace('.json', '');
      }
      
      if (!companyUuid) {
        logger.error('ServiceM8 response missing company uuid in headers and data');
        throw new Error('ServiceM8 did not return a valid company uuid');
      }
      
      logger.info('Created company in ServiceM8', { uuid: companyUuid });
      
      // Fetch the complete company data
      const createdCompany = await this.getCompanyByUuid(companyUuid);
      if (!createdCompany) {
        throw new Error('Failed to fetch created company from ServiceM8');
      }
      
      return createdCompany;
    } catch (error: any) {
      logger.error('Error creating company in ServiceM8', { 
        error: error.message,
        response: error.response?.data 
      });
      throw new Error('Failed to create company in ServiceM8');
    }
  }

  /**
   * Get a company by UUID from ServiceM8
   */
  async getCompanyByUuid(uuid: string): Promise<ServiceM8Company | null> {
    try {
      const response = await this.client.get<ServiceM8Company>(`/company/${uuid}.json`);
      logger.debug('Fetched company from ServiceM8', { uuid });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.debug('Company not found in ServiceM8', { uuid });
        return null;
      }
      logger.error('Error fetching company from ServiceM8', { 
        uuid, 
        error: error.message 
      });
      throw new Error('Failed to fetch company from ServiceM8');
    }
  }

  /**
   * Create a new job in ServiceM8
   */
  async createJob(jobData: CreateJobPayload): Promise<ServiceM8Job> {
    console.log("🚀 ~ ServiceM8Service ~ createJob ~ jobData:", jobData)
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

      logger.debug('Creating job in ServiceM8', { payload });
      const response = await this.client.post<ServiceM8Job>('/job.json', payload);
      logger.debug('ServiceM8 create job response', { 
        status: response.status,
        headers: response.headers,
      });
      
      // ServiceM8 might return the UUID in the Location header or x-record-uuid header
      let jobUuid = response.headers['x-record-uuid'] || response.headers['location'];
      
      // If location header contains a full URL, extract the UUID
      if (jobUuid && jobUuid.includes('/')) {
        const parts = jobUuid.split('/');
        jobUuid = parts[parts.length - 1].replace('.json', '');
      }
      
      if (!jobUuid) {
        logger.error('ServiceM8 response missing uuid in headers and data');
        throw new Error('ServiceM8 did not return a valid job uuid');
      }
      
      logger.info('Created job in ServiceM8', { jobUuid });
      
      // Fetch the complete job data
      const createdJob = await this.getJobByUuid(jobUuid);
      if (!createdJob) {
        throw new Error('Failed to fetch created job from ServiceM8');
      }
      
      return createdJob;
    } catch (error: any) {
      logger.error('Error creating job in ServiceM8', { 
        error: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });
      throw new Error('Failed to create job in ServiceM8');
    }
  }

  /**
   * Update an existing job in ServiceM8
   */
  async updateJob(uuid: string, jobData: Partial<CreateJobPayload>): Promise<ServiceM8Job> {
    try {
      // First fetch the existing job to get all current fields
      const existingJob = await this.getJobByUuid(uuid);
      if (!existingJob) {
        throw new Error('Job not found');
      }

      // Merge the updates with existing data
      const updatedData = {
        ...existingJob,
        ...jobData,
        uuid, // Ensure UUID is preserved
        // Only preserve active if not being updated
        active: jobData.active !== undefined ? jobData.active : existingJob.active,
      };

      logger.debug('Updating job in ServiceM8', { uuid, updates: jobData });
      
      // POST the complete record back to ServiceM8
      const response = await this.client.post<ServiceM8Job>(`/job/${uuid}.json`, updatedData);
      
      logger.debug('ServiceM8 update job response', { 
        status: response.status,
        data: response.data 
      });

      // After update, fetch the latest version to ensure we have current data
      const updatedJob = await this.getJobByUuid(uuid);
      if (!updatedJob) {
        throw new Error('Failed to fetch updated job');
      }

      logger.info('Updated job in ServiceM8', { uuid });
      return updatedJob;
    } catch (error: any) {
      logger.error('Error updating job in ServiceM8', { 
        uuid, 
        error: error.message,
        response: error.response?.data
      });
      throw new Error('Failed to update job in ServiceM8');
    }
  }
}

export const servicem8Service = new ServiceM8Service();

