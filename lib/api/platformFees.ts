import { apiClient } from '../api-client';

export interface PlatformFee {
  id: string;
  contractId: string;
  pharmacyId: string;
  pharmacistId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoiceUrl?: string | null;
  paymentDeadline: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  workContracts?: {
    id: string;
    initialWorkDate?: string;
    startDate: string;
    workDays?: number;
    totalCompensation?: number;
    jobPostings?: {
      title: string;
      workLocation?: string;
    };
    pharmacistProfiles?: {
      id: string;
      firstName: string;
      lastName: string;
    };
    pharmacyProfiles?: {
      pharmacyName: string;
    };
  };
}

export interface FeesResponse {
  fees: PlatformFee[];
}

export interface FeeDetailResponse {
  fee: PlatformFee;
}

export interface ConfirmPaymentData {
  invoiceUrl?: string;
}

export interface UpdateFeeStatusData {
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

// 薬局の手数料一覧を取得
export const getPharmacyFees = async () => {
  return apiClient.get<FeesResponse>('/api/platform-fees/my-fees');
};

// 特定の手数料詳細を取得
export const getFeeDetail = async (feeId: string) => {
  return apiClient.get<FeeDetailResponse>(`/api/platform-fees/${feeId}`);
};

// 手数料の支払いを確認（管理者のみ）
export const confirmPayment = async (feeId: string, data: ConfirmPaymentData) => {
  return apiClient.post<{ message: string; fee: PlatformFee }>(
    `/api/platform-fees/${feeId}/confirm-payment`,
    data
  );
};

// 手数料ステータスを更新（管理者用）
export const updateFeeStatus = async (feeId: string, data: UpdateFeeStatusData) => {
  return apiClient.patch<{ message: string; fee: PlatformFee }>(
    `/api/platform-fees/${feeId}/status`,
    data
  );
};

// 手数料の支払い期限が過ぎているものを取得（管理者用）
export const getOverdueFees = async () => {
  return apiClient.get<{ overdueFees: PlatformFee[] }>('/api/platform-fees/admin/overdue');
};

// すべての手数料を取得（管理者用）
export const getAllFees = async (params?: { status?: string; page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const queryString = queryParams.toString();
  return apiClient.get<{
    fees: PlatformFee[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>(`/api/platform-fees/admin/all${queryString ? `?${queryString}` : ''}`);
};

