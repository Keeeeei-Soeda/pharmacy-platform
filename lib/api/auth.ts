import { apiClient } from '../api-client';

export interface RegisterData {
  email: string;
  password: string;
  userType: 'pharmacist' | 'pharmacy';
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  // 薬剤師固有
  licenseNumber?: string;
  experience?: string;
  // 薬局固有
  pharmacyName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    userType: 'pharmacist' | 'pharmacy';
    isVerified: boolean;
  };
  token: string;
}

export interface UserResponse {
  user: {
    id: string;
    email: string;
    userType: 'pharmacist' | 'pharmacy';
    isVerified: boolean;
    createdAt: string;
    lastLogin: string | null;
  };
}

// Register
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
  apiClient.setToken(response.token);
  return response;
};

// Login
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
  apiClient.setToken(response.token);
  return response;
};

// Logout
export const logout = () => {
  apiClient.removeToken();
};

// Get current user
export const getMe = async (): Promise<UserResponse> => {
  return apiClient.get<UserResponse>('/api/auth/me');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
};



