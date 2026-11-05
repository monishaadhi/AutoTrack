import { apiClient } from './client';
import { WorkOrder } from '../types/enterprise';

export interface WorkOrderFilters {
  plantId?: number;
  lineId?: number;
  status?: string;
  search?: string;
}

export async function getWorkOrders(filters: WorkOrderFilters = {}): Promise<WorkOrder[]> {
  const response = await apiClient.get<{ data: WorkOrder[]; total: number }>('/work-orders', {
    params: filters,
  });
  return response.data?.data || [];
}

export async function createWorkOrder(data: {
  plant_id: number;
  line_id: number;
  model_id: number;
  work_order_number: string;
  planned_quantity: number;
  start_date: string;
  due_date: string;
  status?: string;
}): Promise<WorkOrder> {
  const response = await apiClient.post<WorkOrder>('/work-orders', data);
  return response.data;
}

export async function updateWorkOrder(
  id: number,
  data: Partial<{
    status: string;
    planned_quantity: number;
    due_date: string;
  }>
): Promise<WorkOrder> {
  const response = await apiClient.put<WorkOrder>(`/work-orders/${id}`, data);
  return response.data;
}
