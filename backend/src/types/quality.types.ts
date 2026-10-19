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

export interface QualityIssueRow {
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

export interface QualityFilterParams {
  status?: QualityStatus;
  severity?: QualitySeverity;
  category?: QualityCategory;
  from?: string;
  to?: string;
  lineId?: number;
  page?: number;
  limit?: number;
}
