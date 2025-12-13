import apiClient from '../api-client';

// 薬剤師プロフィール
export interface PharmacistProfile {
  id: string;
  firstName: string;
  lastName: string;
  firstNameKana?: string;
  lastNameKana?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  nearestStation?: string;
  licenseNumber?: string;
  licenseIssuedDate?: string;
  graduationUniversity?: string;
  graduationYear?: number;
  experienceYears?: number;
  specialties?: string[];
  bio?: string;
  hasDriversLicense?: boolean;
  hasHomeCareExperience?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 薬局プロフィール
export interface PharmacyProfile {
  id: string;
  pharmacyName: string;
  pharmacyNameKana?: string;
  representativeName?: string;
  phone?: string;
  fax?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  nearestStation?: string;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  closedDays?: string[];
  establishedDate?: string;
  dailyPrescriptionCount?: number;
  staffCount?: number;
  description?: string;
  features?: string[];
  facilities?: string[];
  websiteUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 薬剤師プロフィール取得
export async function getPharmacistProfile(): Promise<{ profile: PharmacistProfile }> {
  return await apiClient.get<{ profile: PharmacistProfile }>('/api/pharmacists/profile');
}

// 薬剤師プロフィール作成
export async function createPharmacistProfile(
  data: Partial<PharmacistProfile>
): Promise<{ message: string; profile: PharmacistProfile }> {
  return await apiClient.post<{ message: string; profile: PharmacistProfile }>('/api/pharmacists/profile', data);
}

// 薬剤師プロフィール更新
export async function updatePharmacistProfile(
  data: Partial<PharmacistProfile>
): Promise<{ message: string; profile: PharmacistProfile }> {
  return await apiClient.put<{ message: string; profile: PharmacistProfile }>('/api/pharmacists/profile', data);
}

// 薬局プロフィール取得
export async function getPharmacyProfile(): Promise<{ profile: PharmacyProfile }> {
  return await apiClient.get<{ profile: PharmacyProfile }>('/api/pharmacies/profile');
}

// 薬局プロフィール作成
export async function createPharmacyProfile(
  data: Partial<PharmacyProfile>
): Promise<{ message: string; profile: PharmacyProfile }> {
  return await apiClient.post<{ message: string; profile: PharmacyProfile }>('/api/pharmacies/profile', data);
}

// 薬局プロフィール更新
export async function updatePharmacyProfile(
  data: Partial<PharmacyProfile>
): Promise<{ message: string; profile: PharmacyProfile }> {
  return await apiClient.put<{ message: string; profile: PharmacyProfile }>('/api/pharmacies/profile', data);
}

