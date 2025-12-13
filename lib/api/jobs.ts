import { apiClient } from '../api-client';

export interface JobPosting {
  id: string;
  pharmacyId: string;
  title: string;
  description: string | null;
  employmentType: 'full_time' | 'part_time' | 'temporary' | 'contract';
  minHourlyRate: number | null;
  maxHourlyRate: number | null;
  dailyRate?: number | null;
  monthlySalaryMin: number | null;
  monthlySalaryMax: number | null;
  workLocation: string | null;
  workDays: string[];
  scheduledWorkDays?: number[];
  workHoursStart: string | null;
  workHoursEnd: string | null;
  breakTimeMinutes: number | null;
  transportationAllowance: boolean;
  parkingAvailable: boolean;
  uniformProvided: boolean;
  requirements: string | null;
  benefits: string[];
  applicationDeadline: string | null;
  suggestedStartDate?: string | null;
  contractDurationDays?: number | null;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'expired';
  maxApplicants: number | null;
  currentApplicants: number;
  createdAt: string;
  updatedAt: string;
  pharmacy?: {
    id: string;
    pharmacyName: string;
    prefecture: string | null;
    city: string | null;
    nearestStation: string | null;
    profileImageUrl?: string | null;
  };
  _count?: {
    applications: number;
  };
}

export interface JobListResponse {
  jobs: JobPosting[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JobDetailResponse {
  job: JobPosting;
}

export interface CreateJobData {
  pharmacyId: string;
  title: string;
  description?: string;
  employmentType: 'full_time' | 'part_time' | 'temporary' | 'contract';
  minHourlyRate?: number;
  maxHourlyRate?: number;
  dailyRate?: number;
  monthlySalaryMin?: number;
  monthlySalaryMax?: number;
  workLocation?: string;
  workDays?: string[];
  scheduledWorkDays?: number[];
  workHoursStart?: string;
  workHoursEnd?: string;
  suggestedStartDate?: string;
  contractDurationDays?: number;
  breakTimeMinutes?: number;
  transportationAllowance?: boolean;
  parkingAvailable?: boolean;
  uniformProvided?: boolean;
  requirements?: string;
  benefits?: string[];
  applicationDeadline?: string;
  maxApplicants?: number;
}

export interface GetJobsParams {
  page?: number;
  limit?: number;
  employmentType?: string;
  prefecture?: string;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  searchQuery?: string;
}

// Get job listings (for pharmacists)
export const getJobs = async (params?: GetJobsParams): Promise<JobListResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const queryString = queryParams.toString();
  return apiClient.get<JobListResponse>(`/api/jobs${queryString ? `?${queryString}` : ''}`);
};

// Get job detail by ID
export const getJobById = async (id: string): Promise<JobDetailResponse> => {
  return apiClient.get<JobDetailResponse>(`/api/jobs/${id}`);
};

// Get my jobs (for pharmacy)
export const getMyJobs = async (params?: { status?: string; pharmacyId?: string }) => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const queryString = queryParams.toString();
  return apiClient.get<{ jobs: JobPosting[] }>(`/api/jobs/my/list${queryString ? `?${queryString}` : ''}`);
};

// Create job (for pharmacy)
export const createJob = async (data: CreateJobData) => {
  return apiClient.post<{ message: string; job: JobPosting }>('/api/jobs', data);
};

// Update job (for pharmacy)
export const updateJob = async (id: string, data: Partial<CreateJobData>) => {
  return apiClient.put<{ message: string; job: JobPosting }>(`/api/jobs/${id}`, data);
};

// Update job status (for pharmacy)
export const updateJobStatus = async (id: string, status: string) => {
  return apiClient.patch<{ message: string; job: JobPosting }>(`/api/jobs/${id}/status`, { status });
};

// Delete job (for pharmacy)
export const deleteJob = async (id: string) => {
  return apiClient.delete<{ message: string }>(`/api/jobs/${id}`);
};



