import { apiClient } from './client';
import { DashboardSummary, DailyTrendPoint } from '../types/production';
import {
  ProductionByLineItem,
  QualityAnalysisData,
  DefectAnalysisItem,
  WorkOrderStatusItem,
  DowntimeAnalysisData,
  OeeData,
} from '../types/enterprise';

export interface DashboardFilterParams {
  from?: string;
  to?: string;
  lineId?: number;
  plantId?: number;
  aggregation?: 'daily' | 'weekly' | 'monthly';
}

export const getDashboardSummary = async (params?: DashboardFilterParams): Promise<DashboardSummary> => {
  const response = await apiClient.get<any>('/dashboard/summary', { params });
  const raw = response.data;
  if (raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return raw.data as DashboardSummary;
  }
  return raw as DashboardSummary;
};

export const getDashboardTrends = async (params?: DashboardFilterParams): Promise<{ data: DailyTrendPoint[]; total: number }> => {
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

export const getProductionByLine = async (params?: DashboardFilterParams): Promise<ProductionByLineItem[]> => {
  const response = await apiClient.get<{ data: ProductionByLineItem[] }>('/dashboard/production-by-line', { params });
  return response.data?.data || [];
};

export const getQualityAnalysis = async (params?: DashboardFilterParams): Promise<QualityAnalysisData> => {
  const response = await apiClient.get<QualityAnalysisData>('/dashboard/quality-analysis', { params });
  return response.data;
};

export const getDefectAnalysis = async (params?: DashboardFilterParams): Promise<DefectAnalysisItem[]> => {
  const response = await apiClient.get<{ data: DefectAnalysisItem[] }>('/dashboard/defect-analysis', { params });
  return response.data?.data || [];
};

export const getWorkOrderStatusDistribution = async (params?: { plantId?: number; lineId?: number }): Promise<WorkOrderStatusItem[]> => {
  const response = await apiClient.get<{ data: WorkOrderStatusItem[] }>('/dashboard/work-order-status', { params });
  return response.data?.data || [];
};

export const getDowntimeAnalysis = async (params?: DashboardFilterParams): Promise<DowntimeAnalysisData> => {
  const response = await apiClient.get<DowntimeAnalysisData>('/dashboard/downtime-analysis', { params });
  return response.data;
};

export const getOeeMetrics = async (params?: DashboardFilterParams): Promise<OeeData> => {
  const response = await apiClient.get<OeeData>('/dashboard/oee', { params });
  return response.data;
};
