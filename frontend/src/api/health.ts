import { apiClient } from './client';
import { SystemHealth } from '../types/production';

export const checkSystemHealth = async (): Promise<SystemHealth> => {
  const response = await apiClient.get<SystemHealth>('/health');
  return response.data;
};
