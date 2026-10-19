import { apiClient } from './client';
import { QualityIssue, PaginatedResponse, QualityStatus } from '../types/production';

export interface QualityFilterOptions {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  category?: string;
  from?: string;
  to?: string;
  lineId?: number;
}

export const getQualityIssues = async (
  params?: QualityFilterOptions
): Promise<PaginatedResponse<QualityIssue>> => {
  const response = await apiClient.get<any>('/quality-issues', {
    params,
  });
  const raw = response.data;
  if (Array.isArray(raw)) {
    return {
      data: raw,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || raw.length,
        total: raw.length,
        totalPages: 1,
      },
    };
  }
  if (raw && Array.isArray(raw.data)) {
    return {
      data: raw.data,
      pagination: raw.pagination || {
        page: params?.page || 1,
        limit: params?.limit || raw.data.length,
        total: raw.total ?? raw.data.length,
        totalPages: 1,
      },
    };
  }
  return {
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
};

export const getQualityIssueById = async (id: number): Promise<QualityIssue> => {
  const response = await apiClient.get<QualityIssue>(`/quality-issues/${id}`);
  return response.data;
};

export const updateQualityIssueStatus = async (
  id: number,
  status: QualityStatus
): Promise<QualityIssue> => {
  const response = await apiClient.patch<QualityIssue>(`/quality-issues/${id}/status`, {
    status,
  });
  return response.data;
};
