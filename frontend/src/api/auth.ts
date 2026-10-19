import { apiClient } from './client';
import { AuthResponse, LoginInput, User } from '../types/auth';

export async function loginApi(credentials: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return response.data;
}

export async function getCurrentUserApi(): Promise<{ user: User }> {
  const response = await apiClient.get<{ user: User }>('/auth/me');
  return response.data;
}

export async function logoutApi(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>('/auth/logout');
  return response.data;
}
