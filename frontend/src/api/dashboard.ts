import { apiClient } from './client';
import { DashboardSummary, DailyTrendPoint } from '../types/production';

export const getDashboardSummary = async (params?: {
  from?: string;
  to?: string;
  lineId?: number;
}): Promise<DashboardSummary> => {
  const response = await apiClient.get<any>('/dashboard/summary', { params });
  const raw = response.data;
  if (raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return raw.data as DashboardSummary;
  }
  return raw as DashboardSummary;
};

export const getDashboardTrends = async (params?: {
  from?: string;
  to?: string;
}): Promise<{ data: DailyTrendPoint[]; total: number }> => {
  const response = await apiClient.get<any>('/dashboard/trends', { params });
  const raw = response.data;
  if (Array.isArray(raw)) {
    return { data: raw, total: raw.length };
  }
  if (raw && Array.isArray(raw.data)) {
    return { data: raw.data, total: raw.total ?? raw.data.length };
  }
  return { data: [], total: 0 };
};
