import {
  dashboardRepository,
  DashboardRepository,
} from '../repositories/dashboard.repository';
import {
  calculateAchievementRate,
  calculateScrapRate,
  calculateYieldRate,
} from '../utils/calculations';
import {
  DashboardSummaryDTO,
  DailyTrendPointDTO,
  DashboardFilterParams,
} from '../types/dashboard.types';

export class DashboardService {
  constructor(private repo: DashboardRepository = dashboardRepository) {}

  /**
   * Calculates overall dashboard summary metrics using real aggregated data.
   */
  async getSummary(filters: DashboardFilterParams = {}): Promise<DashboardSummaryDTO> {
    const agg = await this.repo.getAggregateMetrics(filters);
    const lines = await this.repo.getLinesBreakdown();
    const activeQualityIssues = await this.repo.getActiveQualityIssuesCount();

    const target_achievement_percentage = calculateAchievementRate(
      agg.total_produced,
      agg.total_target
    );
    const defect_rate_percentage = calculateScrapRate(
      agg.total_produced,
      agg.total_defects
    );
    const yield_percentage = calculateYieldRate(
      agg.total_produced,
      agg.total_defects
    );

    return {
      total_produced: agg.total_produced,
      total_target: agg.total_target,
      target_achievement_percentage,
      total_defects: agg.total_defects,
      defect_rate_percentage,
      yield_percentage,
      total_downtime_minutes: agg.total_downtime_minutes,
      total_records: agg.total_records,
      active_quality_issues: activeQualityIssues,
      lines_breakdown: lines,
    };
  }

  /**
   * Retrieves date-wise production and target trends for charts.
   */
  async getTrends(from?: string, to?: string): Promise<DailyTrendPointDTO[]> {
    const rawTrends = await this.repo.getDailyTrends(from, to);

    return rawTrends.map((point) => ({
      ...point,
      achievement_rate: calculateAchievementRate(point.produced, point.target),
    }));
  }
}

export const dashboardService = new DashboardService();
