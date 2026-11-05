import { apiClient } from './client';
import { Equipment, DowntimeRecord } from '../types/enterprise';

export interface EquipmentFilters {
  lineId?: number;
  plantId?: number;
  status?: string;
}

export async function getEquipment(filters: EquipmentFilters = {}): Promise<Equipment[]> {
  const response = await apiClient.get<{ data: Equipment[]; total: number }>('/equipment', {
    params: filters,
  });
  return response.data?.data || [];
}

export interface DowntimeFilters {
  equipmentId?: number;
  lineId?: number;
  from?: string;
  to?: string;
  limit?: number;
}

export async function getDowntimeRecords(filters: DowntimeFilters = {}): Promise<DowntimeRecord[]> {
  const response = await apiClient.get<{ data: DowntimeRecord[]; total: number }>('/equipment/downtime', {
    params: filters,
  });
  return response.data?.data || [];
}
