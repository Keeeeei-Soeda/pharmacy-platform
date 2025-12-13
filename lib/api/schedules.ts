import { apiClient } from '../api-client';

export interface WorkSchedule {
  id: string;
  contractId: string;
  workDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  breakTimeMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    pharmacy?: {
      pharmacyName: string;
      prefecture: string;
      city: string;
    };
    pharmacist?: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateScheduleRequest {
  contractId: string;
  workDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  breakTimeMinutes?: number;
  notes?: string;
}

export interface CreateBulkSchedulesRequest {
  contractId: string;
  startDate: string;
  endDate: string;
  weekdays: number[]; // 0=日曜, 1=月曜, ..., 6=土曜
  scheduledStartTime: string;
  scheduledEndTime: string;
  breakTimeMinutes?: number;
  notes?: string;
}

export interface UpdateScheduleRequest {
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  breakTimeMinutes?: number;
  notes?: string;
}

// スケジュール作成
export async function createSchedule(data: CreateScheduleRequest): Promise<WorkSchedule> {
  const response = await apiClient.post<{ message: string; schedule: WorkSchedule }>('/api/schedules', data);
  return response.schedule;
}

// 一括スケジュール作成
export async function createBulkSchedules(data: CreateBulkSchedulesRequest): Promise<WorkSchedule[]> {
  const response = await apiClient.post<{ message: string; schedules: WorkSchedule[] }>('/api/schedules/bulk', data);
  return response.schedules;
}

// 契約別スケジュール取得
export async function getSchedulesByContract(
  contractId: string,
  startDate?: string,
  endDate?: string
): Promise<WorkSchedule[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await apiClient.get<{ schedules: WorkSchedule[] }>(`/api/schedules/contract/${contractId}?${params.toString()}`);
  return response.schedules;
}

// 薬剤師用スケジュール取得
export async function getPharmacistSchedules(
  startDate?: string,
  endDate?: string
): Promise<WorkSchedule[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await apiClient.get<{ schedules: WorkSchedule[] }>(`/api/schedules/pharmacist/my?${params.toString()}`);
  return response.schedules;
}

// 薬局用スケジュール取得
export async function getPharmacySchedules(
  startDate?: string,
  endDate?: string
): Promise<WorkSchedule[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await apiClient.get<{ schedules: WorkSchedule[] }>(`/api/schedules/pharmacy/my?${params.toString()}`);
  return response.schedules;
}

// スケジュール更新
export async function updateSchedule(id: string, data: UpdateScheduleRequest): Promise<WorkSchedule> {
  const response = await apiClient.patch<{ message: string; schedule: WorkSchedule }>(`/api/schedules/${id}`, data);
  return response.schedule;
}

// スケジュール削除
export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.delete(`/api/schedules/${id}`);
}



