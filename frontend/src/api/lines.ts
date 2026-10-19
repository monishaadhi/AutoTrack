import { apiClient } from './client';
import { ProductionLine } from '../types/production';

export const getProductionLines = async (params?: {
  factoryId?: number;
  status?: string;
}): Promise<{ data: ProductionLine[]; total: number }> => {
  const response = await apiClient.get<any>('/lines', { params });
  const raw = response.data;
  if (Array.isArray(raw)) {
    return { data: raw, total: raw.length };
  }
  if (raw && Array.isArray(raw.data)) {
    return { data: raw.data, total: raw.total ?? raw.data.length };
  }
  return { data: [], total: 0 };
};

export const getProductionLineById = async (id: number): Promise<ProductionLine> => {
  const response = await apiClient.get<ProductionLine>(`/lines/${id}`);
  return response.data;
};
