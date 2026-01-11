import { apiClient } from '../api-client';

// 契約関連の型定義
export interface WorkContract {
  id: string;
  applicationId: number;
  pharmacyId: number;
  pharmacistId: number;
  status: 'pending' | 'active' | 'completed' | 'terminated' | 'rejected';
  offerSentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  terms: string | null;
  workNoticeUrl: string | null; // 労働条件通知書PDFのURL
  contractStartDate: string | null;
  contractEndDate: string | null;
  dailyRate: number | null;
  hourlyRate: number | null;
  scheduledWorkDays: number[];
  workDays: string[];
  workHoursStart: string | null;
  workHoursEnd: string | null;
  breakTimeMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pharmacy?: {
    id: string;
    pharmacyName: string;
    prefecture: string;
    city: string;
    userId?: string;
    profileImageUrl?: string | null;
  };
  pharmacist?: {
    id: string;
    firstName: string;
    lastName: string;
    userId?: string;
    profileImageUrl?: string | null;
  };
  application?: {
    id: string;
    status?: string;
    jobPosting?: {
      id: string;
      title: string;
      description: string;
      pharmacy?: {
        id?: string;
        pharmacyName: string;
        profileImageUrl?: string | null;
      };
    };
    pharmacist?: {
      id?: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string | null;
    };
  };
}

// 薬局側: 採用オファー送信
export const sendJobOffer = async (data: {
  applicationId: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}): Promise<{ contract: WorkContract; message: string }> => {
  return apiClient.post('/api/contracts/offer', data);
};

// 薬剤師側: オファー承諾
export const acceptJobOffer = async (contractId: string): Promise<{
  contract: WorkContract;
  workNotice: string;
  message: string;
}> => {
  return apiClient.post(`/api/contracts/${contractId}/accept`, {});
};

// 薬剤師側: オファー辞退
export const rejectJobOffer = async (contractId: string, reason?: string): Promise<{
  contract: WorkContract;
  message: string;
}> => {
  return apiClient.post(`/api/contracts/${contractId}/reject`, { reason });
};

// 契約一覧取得（薬剤師用）
export const getPharmacistContracts = async (): Promise<{ contracts: WorkContract[] }> => {
  return apiClient.get('/api/contracts/pharmacist');
};

// 契約一覧取得（薬局用）
export const getPharmacyContracts = async (): Promise<{ contracts: WorkContract[] }> => {
  return apiClient.get('/api/contracts/pharmacy');
};

// 契約詳細取得
export const getContractDetail = async (contractId: string): Promise<{ contract: WorkContract }> => {
  return apiClient.get(`/api/contracts/${contractId}`);
};

