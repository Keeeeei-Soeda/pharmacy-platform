import { apiClient } from '../api-client';

export interface MessageData {
  proposedDates?: string[];
  selectedDate?: string;
  message?: string;
  initialWorkDate?: string;
  workDays?: number;
  dailyRate?: number; // 追加: 日給
  totalCompensation?: number;
  workHours?: string;
  platformFee?: number;
  paymentDeadline?: string;
  response?: 'accept' | 'decline';
  [key: string]: unknown;
}

export interface StructuredMessage {
  id: number;
  applicationId: number;
  messageType: 'date_proposal' | 'date_selection' | 'condition_confirmation' | 'formal_offer' | 'offer_response';
  proposedDates?: string[];
  selectedDate?: string | null;
  initialWorkDate?: string | null;
  workDays?: number | null;
  dailyRate?: number | null; // 追加: 日給
  totalCompensation?: number | null;
  workHours?: string | null;
  platformFee?: number | null;
  paymentDeadline?: string | null;
  pharmacistResponse?: 'accepted' | 'rejected' | null;
  sentBy: 'pharmacy' | 'pharmacist';
  createdAt: string;
  updatedAt: string;
}

export interface ProposeDatesData {
  applicationId: number;
  proposedDates: string[]; // 候補日の配列（ISO形式の日付文字列）
}

export interface SelectDateData {
  messageId: number;
  selectedDate: string; // ISO形式の日付文字列
}

export interface SendFormalOfferData {
  applicationId: number;
  initialWorkDate: string; // ISO形式の日付文字列
  workDays: number;
  dailyRate: number; // 追加: 日給（20,000円以上）
  workHours: string;
  paymentDeadline: string; // ISO形式の日付文字列
  // totalCompensationとplatformFeeはサーバー側で自動計算される
}

export interface RespondToOfferData {
  messageId: number;
  accepted: boolean;
}

// 初回出勤日の候補を提案（薬局側）
export const proposeDates = async (data: ProposeDatesData): Promise<StructuredMessage> => {
  const response = await apiClient.post<StructuredMessage>(
    '/api/structured-messages/propose-dates',
    data
  );
  return response;
};

// 初回出勤日を選択（薬剤師側）
export const selectDate = async (data: SelectDateData): Promise<StructuredMessage> => {
  const response = await apiClient.post<StructuredMessage>(
    '/api/structured-messages/select-date',
    data
  );
  return response;
};

// 正式オファーを送信（薬局側）
export const sendFormalOffer = async (data: SendFormalOfferData): Promise<StructuredMessage> => {
  const response = await apiClient.post<StructuredMessage>(
    '/api/structured-messages/formal-offer',
    data
  );
  return response;
};

// オファーに対する回答（薬剤師側）
export const respondToOffer = async (data: RespondToOfferData): Promise<StructuredMessage> => {
  const response = await apiClient.post<StructuredMessage>(
    '/api/structured-messages/respond-offer',
    data
  );
  return response;
};

// 応募に紐づく構造化メッセージを取得
export const getStructuredMessages = async (applicationId: number): Promise<StructuredMessage[]> => {
  const response = await apiClient.get<StructuredMessage[]>(
    `/api/structured-messages/application/${applicationId}`
  );
  return response;
};

