import { apiClient } from './client';
import { Plant } from '../types/enterprise';

export async function getPlants(): Promise<Plant[]> {
  const response = await apiClient.get<{ data: Plant[] }>('/plants');
  return response.data?.data || [];
}
