import apiClient from '../api-client';

export interface PharmacistListItem {
  id: string;
  userId: string;
  fullName: string;
  fullNameKana: string | null;
  email: string;
  licenseNumber: string | null;
  prefecture: string | null;
  city: string | null;
  experienceYears: number | null;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedAt: string | null;
  verifiedBy: string | null;
  licenseUploaded: boolean;
  registrationUploaded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacistDetail {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  firstNameKana: string | null;
  lastNameKana: string | null;
  fullName: string;
  fullNameKana: string | null;
  email: string;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  nearestStation: string | null;
  licenseNumber: string | null;
  licenseIssuedDate: string | null;
  graduationUniversity: string | null;
  graduationYear: number | null;
  experienceYears: number | null;
  specialties: string[];
  licenseFilePath: string | null;
  registrationFilePath: string | null;
  licenseUploadedAt: string | null;
  registrationUploadedAt: string | null;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  bio: string | null;
  hasDriversLicense: boolean | null;
  hasHomeCareExperience: boolean | null;
  applicationCount: number;
  contractCount: number;
  recentApplications: unknown[];
  recentContracts: unknown[];
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface Statistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// 統計情報を取得
export async function getAdminStatistics(): Promise<Statistics> {
  return apiClient.get<Statistics>('/admin/statistics');
}

// 薬剤師一覧を取得
export async function getAdminPharmacists(params?: {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  search?: string;
}): Promise<{ total: number; pharmacists: PharmacistListItem[] }> {
  // NOTE: ApiClientはfetchベースで { params } を扱わないためクエリを自前で組み立てる
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiClient.get<{ total: number; pharmacists: PharmacistListItem[] }>(`/admin/pharmacists${suffix}`);
}

// 薬剤師詳細を取得
export async function getAdminPharmacistDetail(id: string): Promise<PharmacistDetail> {
  return apiClient.get<PharmacistDetail>(`/admin/pharmacists/${id}`);
}

// 本人確認を承認
export async function approvePharmacistVerification(
  id: string,
  notes?: string
): Promise<void> {
  await apiClient.post(`/admin/pharmacists/${id}/approve`, { notes });
}

// 本人確認を却下
export async function rejectPharmacistVerification(
  id: string,
  reason: string
): Promise<void> {
  await apiClient.post(`/admin/pharmacists/${id}/reject`, { reason });
}

// 本人確認をリセット
export async function resetPharmacistVerification(id: string): Promise<void> {
  await apiClient.post(`/admin/pharmacists/${id}/reset`);
}

// 証明書ファイルのURLを取得
export function getAdminLicenseFileUrl(filename: string): string {
  const token = localStorage.getItem('auth_token');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${API_BASE_URL}/api/uploads/license/${filename}?token=${token}`;
}

