export interface PeriodComparisonDTO {
  production_change_pct: number;
  defects_change_pct: number;
  downtime_change_pct: number;
  achievement_change_pct: number;
}

export interface DashboardSummaryDTO {
  total_produced: number;
  daily_produced: number;
  total_target: number;
  target_achievement_percentage: number;
  total_defects: number;
  defect_rate_percentage: number;
  yield_percentage: number;
  oee_percentage: number;
  availability_percentage: number;
  performance_percentage: number;
  quality_percentage: number;
  total_downtime_minutes: number;
  total_records: number;
  active_lines_count: number;
  total_lines_count: number;
  active_quality_issues: number;
  lines_breakdown: {
    total: number;
    running: number;
    maintenance: number;
    stopped: number;
  };
  comparison: PeriodComparisonDTO;
}

export interface DailyTrendPointDTO {
  date: string;
  target: number;
  produced: number;
  defects: number;
  downtime_minutes: number;
  achievement_rate: number;
  variance?: number;
}

export interface DashboardFilterParams {
  from?: string;
  to?: string;
  lineId?: number;
  plantId?: number;
  aggregation?: 'daily' | 'weekly' | 'monthly';
}
