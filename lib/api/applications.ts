import { apiClient } from '../api-client';
import { JobPosting } from './jobs';

export interface JobApplication {
  id: string;
  jobPostingId: string;
  pharmacistId: string;
  coverLetter: string | null;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
  reviewedAt: string | null;
  interviewScheduledAt: string | null;
  decisionMadeAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  jobPosting?: Partial<JobPosting>;
  pharmacist?: {
    id: string;
    firstName: string;
    lastName: string;
    experienceYears: number | null;
    specialties: string[];
    profileImageUrl: string | null;
    phone: string | null;
    hasDriversLicense: boolean;
    hasHomeCareExperience: boolean;
    user?: {
      email: string;
    };
  };
  messageThread?: {
    id: string;
    _count?: {
      messages: number;
    };
  };
}

export interface ApplyToJobData {
  jobPostingId: string;
  coverLetter?: string;
}

export interface ApplicationsResponse {
  applications: JobApplication[];
}

export interface ApplicationDetailResponse {
  application: JobApplication;
}

// Apply to job (for pharmacist)
export const applyToJob = async (data: ApplyToJobData) => {
  return apiClient.post<{ message: string; application: JobApplication }>('/api/applications', data);
};

// Get my applications (for pharmacist)
export const getMyApplications = async (params?: { status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  const queryString = queryParams.toString();
  return apiClient.get<ApplicationsResponse>(`/api/applications/my${queryString ? `?${queryString}` : ''}`);
};

// Get applications for pharmacy (for pharmacy)
export const getApplicationsForPharmacy = async (params?: { status?: string; jobPostingId?: string }) => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
  }
  const queryString = queryParams.toString();
  return apiClient.get<ApplicationsResponse>(`/api/applications${queryString ? `?${queryString}` : ''}`);
};

// Get application by ID
export const getApplicationById = async (id: string) => {
  return apiClient.get<ApplicationDetailResponse>(`/api/applications/${id}`);
};

// Accept application (for pharmacy)
export const acceptApplication = async (id: string, notes?: string) => {
  return apiClient.patch<{ message: string; application: JobApplication }>(`/api/applications/${id}/accept`, { notes });
};

// Reject application (for pharmacy)
export const rejectApplication = async (id: string, data: { rejectionReason?: string; notes?: string }) => {
  return apiClient.patch<{ message: string; application: JobApplication }>(`/api/applications/${id}/reject`, data);
};

// Withdraw application (for pharmacist)
export const withdrawApplication = async (id: string) => {
  return apiClient.patch<{ message: string; application: JobApplication }>(`/api/applications/${id}/withdraw`, {});
};

