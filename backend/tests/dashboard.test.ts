import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { dashboardRepository } from '../src/repositories/dashboard.repository';

describe('Dashboard API (/api/dashboard)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/dashboard/summary', () => {
    it('returns aggregate manufacturing KPIs from aggregated database totals', async () => {
      vi.spyOn(dashboardRepository, 'getAggregateMetrics').mockResolvedValue({
        total_produced: 1950,
        total_target: 2000,
        total_defects: 50,
        total_downtime_minutes: 120,
        total_records: 7,
      });

      vi.spyOn(dashboardRepository, 'getLinesBreakdown').mockResolvedValue({
        total: 6,
        running: 4,
        maintenance: 1,
        stopped: 1,
      });

      vi.spyOn(dashboardRepository, 'getActiveQualityIssuesCount').mockResolvedValue(3);

      const res = await request(app).get('/api/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.total_produced).toBe(1950);
      expect(res.body.total_target).toBe(2000);
      // (1950 / 2000) * 100 = 97.5%
      expect(res.body.target_achievement_percentage).toBe(97.5);
      // (50 / (1950 + 50)) * 100 = 2.5%
      expect(res.body.defect_rate_percentage).toBe(2.5);
      // (1950 / (1950 + 50)) * 100 = 97.5%
      expect(res.body.yield_percentage).toBe(97.5);
      expect(res.body.total_downtime_minutes).toBe(120);
      expect(res.body.total_records).toBe(7);
      expect(res.body.active_quality_issues).toBe(3);
      expect(res.body.lines_breakdown).toEqual({
        total: 6,
        running: 4,
        maintenance: 1,
        stopped: 1,
      });
    });

    it('safely handles zero denominators without dividing by zero', async () => {
      vi.spyOn(dashboardRepository, 'getAggregateMetrics').mockResolvedValue({
        total_produced: 0,
        total_target: 0,
        total_defects: 0,
        total_downtime_minutes: 0,
        total_records: 0,
      });

      vi.spyOn(dashboardRepository, 'getLinesBreakdown').mockResolvedValue({
        total: 0,
        running: 0,
        maintenance: 0,
        stopped: 0,
      });

      vi.spyOn(dashboardRepository, 'getActiveQualityIssuesCount').mockResolvedValue(0);

      const res = await request(app).get('/api/dashboard/summary');

      expect(res.status).toBe(200);
      expect(res.body.target_achievement_percentage).toBe(0);
      expect(res.body.defect_rate_percentage).toBe(0);
      expect(res.body.yield_percentage).toBe(100);
    });

    it('filters summary metrics by date range', async () => {
      const spy = vi.spyOn(dashboardRepository, 'getAggregateMetrics').mockResolvedValue({
        total_produced: 300,
        total_target: 350,
        total_defects: 5,
        total_downtime_minutes: 10,
        total_records: 1,
      });
      vi.spyOn(dashboardRepository, 'getLinesBreakdown').mockResolvedValue({
        total: 1,
        running: 1,
        maintenance: 0,
        stopped: 0,
      });
      vi.spyOn(dashboardRepository, 'getActiveQualityIssuesCount').mockResolvedValue(0);

      const res = await request(app).get(
        '/api/dashboard/summary?from=2026-10-15&to=2026-10-18&lineId=1'
      );

      expect(res.status).toBe(200);
      expect(spy).toHaveBeenCalledWith({
        from: '2026-10-15',
        to: '2026-10-18',
        lineId: 1,
      });
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('returns daily trend points with computed achievement rate', async () => {
      vi.spyOn(dashboardRepository, 'getDailyTrends').mockResolvedValue([
        {
          date: '2026-10-15',
          target: 400,
          produced: 380,
          defects: 8,
          downtime_minutes: 20,
        },
      ]);

      const res = await request(app).get(
        '/api/dashboard/trends?from=2026-10-15&to=2026-10-16'
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].date).toBe('2026-10-15');
      expect(res.body.data[0].achievement_rate).toBe(95.0);
    });

    it('rejects trend requests where from date is after to date', async () => {
      const res = await request(app).get(
        '/api/dashboard/trends?from=2026-10-20&to=2026-10-15'
      );

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.details[0].message).toContain(
        'from date must be less than or equal to to date'
      );
    });

    it('rejects invalid date formats with 400', async () => {
      const res = await request(app).get('/api/dashboard/trends?from=15-10-2026');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });
  });
});
