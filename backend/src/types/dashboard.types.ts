export interface DashboardSummaryDTO {
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

export interface DailyTrendPointDTO {
  date: string;
  target: number;
  produced: number;
  defects: number;
  downtime_minutes: number;
  achievement_rate: number;
}

export interface DashboardFilterParams {
  from?: string;
  to?: string;
  lineId?: number;
}
