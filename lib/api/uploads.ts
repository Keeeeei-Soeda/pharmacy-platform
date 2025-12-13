import apiClient from '../api-client';

export interface LicenseInfo {
  license: {
    uploaded: boolean;
    path: string | null;
    uploadedAt: string | null;
  };
  registration: {
    uploaded: boolean;
    path: string | null;
    uploadedAt: string | null;
  };
  verificationStatus: string;
  verifiedAt: string | null;
}

export interface UploadResponse {
  message: string;
  file: {
    filename: string;
    path: string;
    size: number;
    uploadedAt: string;
  };
}

// 証明書をアップロード
export async function uploadLicense(file: File, type: 'license' | 'registration'): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  // FormDataの場合は直接fetchを使用
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/uploads/license`,
    {
      method: 'POST',
      headers,
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'アップロードに失敗しました');
  }

  const data = await response.json();
  return data;
}

// 証明書情報を取得
export async function getLicenseInfo(): Promise<LicenseInfo> {
  return await apiClient.get<LicenseInfo>('/api/uploads/license/info');
}

// 証明書ファイルのURLを取得
export function getLicenseFileUrl(filename: string): string {
  const token = localStorage.getItem('auth_token');
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/uploads/license/${filename}?token=${token}`;
}

// 証明書を削除
export async function deleteLicense(type: 'license' | 'registration'): Promise<void> {
  await apiClient.delete(`/api/uploads/license/${type}`);
}

