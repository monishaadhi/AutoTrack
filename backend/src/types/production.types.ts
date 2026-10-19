export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT';

export interface ProductionRecordRow {
  record_id: number;
  line_id: number;
  line_name?: string;
  factory_id?: number;
  factory_name?: string;
  production_date: string;
  shift: ShiftType;
  target_quantity: number;
  produced_quantity: number;
  defect_count: number;
  downtime_minutes: number;
  created_at: string;
  updated_at?: string;
}

export interface ProductionRecordDTO extends ProductionRecordRow {
  achievement_rate: number;
  scrap_rate: number;
  yield_rate: number;
}

export interface CreateProductionRecordInput {
  line_id: number;
  production_date: string;
  shift: ShiftType;
  target_quantity: number;
  produced_quantity: number;
  defect_count?: number;
  downtime_minutes?: number;
}

export interface UpdateProductionRecordInput {
  line_id?: number;
  production_date?: string;
  shift?: ShiftType;
  target_quantity?: number;
  produced_quantity?: number;
  defect_count?: number;
  downtime_minutes?: number;
}

export interface ProductionFilterParams {
  startDate?: string;
  endDate?: string;
  lineId?: number;
  shift?: ShiftType;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
