export interface PlantDTO {
  plant_id: number;
  plant_code: string;
  plant_name: string;
  location: string;
  country: string;
  timezone: string;
  created_at: string;
}

export interface VehicleModelDTO {
  model_id: number;
  model_code: string;
  model_name: string;
  vehicle_type: string;
  manufacturer: string;
  ideal_cycle_time_seconds: number;
  created_at: string;
}

export type WorkOrderStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';

export interface WorkOrderDTO {
  work_order_id: number;
  order_id?: number;
  plant_id: number;
  plant_name?: string;
  line_id: number;
  line_name?: string;
  model_id: number;
  model_name?: string;
  model_code?: string;
  work_order_number: string;
  planned_quantity: number;
  completed_quantity?: number;
  start_date: string;
  due_date: string;
  status: WorkOrderStatus;
  created_by?: number;
  created_at: string;
  updated_at?: string;
}

export interface EquipmentDTO {
  equipment_id: number;
  line_id: number;
  line_name?: string;
  plant_id?: number;
  plant_name?: string;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  status: 'RUNNING' | 'MAINTENANCE' | 'STOPPED' | 'STANDBY';
  created_at: string;
  updated_at?: string;
}

export interface DowntimeRecordDTO {
  downtime_id: number;
  equipment_id: number;
  equipment_code?: string;
  equipment_name?: string;
  line_id?: number;
  line_name?: string;
  production_id?: number;
  downtime_start: string;
  downtime_end?: string;
  duration_minutes: number;
  downtime_reason: string;
  created_at: string;
}

export interface QualityAnalysisDTO {
  accepted_count: number;
  rejected_count: number;
  pending_count: number;
  total_inspections: number;
  accepted_percentage: number;
  rejected_percentage: number;
  pending_percentage: number;
}

export interface DefectAnalysisDTO {
  category_name: string;
  defect_count: number;
  percentage: number;
  severity: string;
}

export interface WorkOrderStatusDistributionDTO {
  status: WorkOrderStatus;
  count: number;
  percentage: number;
}

export interface ProductionByLineDTO {
  line_id: number;
  line_code: string;
  line_name: string;
  plant_id: number;
  plant_name: string;
  target_quantity: number;
  produced_quantity: number;
  achievement_percentage: number;
  status: string;
}

export interface DowntimeAnalysisDTO {
  by_line: {
    line_id: number;
    line_name: string;
    total_downtime_minutes: number;
  }[];
  by_equipment: {
    equipment_id: number;
    equipment_name: string;
    total_downtime_minutes: number;
    incident_count: number;
  }[];
  top_reasons: {
    reason: string;
    total_minutes: number;
    incident_count: number;
  }[];
}

export interface OeeBreakdownDTO {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  operating_time_minutes: number;
  planned_time_minutes: number;
  downtime_minutes: number;
  total_units: number;
  good_units: number;
  scrap_units: number;
}
