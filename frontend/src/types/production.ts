export type ShiftType = 'MORNING' | 'EVENING' | 'NIGHT';

export type LineStatus = 'RUNNING' | 'STOPPED' | 'MAINTENANCE';

export type QualityCategory =
  | 'PAINT'
  | 'WELD'
  | 'ASSEMBLY'
  | 'ELECTRICAL'
  | 'ALIGNMENT'
  | 'TRIM'
  | 'OTHER';

export type QualitySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type QualityStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface ProductionLine {
  line_id: number;
  factory_id: number;
  factory_name: string;
  factory_location: string;
  name: string;
  status: LineStatus;
  created_at: string;
}

export interface ProductionRecord {
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
  achievement_rate?: number;
  scrap_rate?: number;
  yield_rate?: number;
}

export interface QualityIssue {
  issue_id: number;
  record_id: number;
  line_id?: number;
  line_name?: string;
  factory_id?: number;
  factory_name?: string;
  production_date?: string;
  shift?: string;
  category: QualityCategory;
  severity: QualitySeverity;
  status: QualityStatus;
  description: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardSummary {
  total_produced: number;
  total_target: number;
  target_achievement_percentage: number;
  total_defects: number;
  defect_rate_percentage: number;
  yield_percentage: number;
  total_downtime_minutes: number;
  total_records: number;
  active_quality_issues: number;
  lines_breakdown: {
    total: number;
    running: number;
    maintenance: number;
    stopped: number;
  };
}

export interface DailyTrendPoint {
  date: string;
  target: number;
  produced: number;
  defects: number;
  downtime_minutes: number;
  achievement_rate: number;
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

export interface SystemHealth {
  status: 'UP' | 'DEGRADED';
  database: 'CONNECTED' | 'DISCONNECTED';
  timestamp: string;
  details?: string;
  error?: string;
}
