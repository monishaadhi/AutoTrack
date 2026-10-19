import { apiClient } from './client';
import { ProductionRecord, PaginatedResponse } from '../types/production';

export interface ProductionFilterOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  lineId?: number;
  shift?: string;
}

export const getProductionRecords = async (
  params?: ProductionFilterOptions
): Promise<PaginatedResponse<ProductionRecord>> => {
  const response = await apiClient.get<any>('/production', {
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

export const getProductionRecordById = async (id: number): Promise<ProductionRecord> => {
  const response = await apiClient.get<ProductionRecord>(`/production/${id}`);
  return response.data;
};

export const createProductionRecord = async (
  data: Omit<ProductionRecord, 'record_id' | 'created_at' | 'updated_at'>
): Promise<ProductionRecord> => {
  const response = await apiClient.post<ProductionRecord>('/production', data);
  return response.data;
};

export const updateProductionRecord = async (
  id: number,
  data: Partial<ProductionRecord>
): Promise<ProductionRecord> => {
  const response = await apiClient.put<ProductionRecord>(`/production/${id}`, data);
  return response.data;
};

export const deleteProductionRecord = async (
  id: number
): Promise<{ success: boolean; message: string; deletedId: number }> => {
  const response = await apiClient.delete<{ success: boolean; message: string; deletedId: number }>(
    `/production/${id}`
  );
  return response.data;
};
