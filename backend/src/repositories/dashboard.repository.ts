import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { DashboardFilterParams } from '../types/dashboard.types';

export class DashboardRepository {
  /**
   * Aggregates total production, targets, defects, and downtime using real SQL aggregation.
   */
  async getAggregateMetrics(filters: DashboardFilterParams): Promise<{
    total_produced: number;
    total_target: number;
    total_defects: number;
    total_downtime_minutes: number;
    total_records: number;
  }> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.from) {
      conditions.push('production_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('production_date <= ?');
      params.push(filters.to);
    }
    if (filters.lineId !== undefined) {
      conditions.push('line_id = ?');
      params.push(filters.lineId);
    }

    const sql = `
      SELECT 
        COALESCE(SUM(produced_quantity), 0) AS total_produced,
        COALESCE(SUM(target_quantity), 0) AS total_target,
        COALESCE(SUM(defect_count), 0) AS total_defects,
        COALESCE(SUM(downtime_minutes), 0) AS total_downtime_minutes,
        COUNT(*) AS total_records
      FROM production_records
      WHERE ${conditions.join(' AND ')}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    const row = rows[0] || {};

    return {
      total_produced: Number(row.total_produced || 0),
      total_target: Number(row.total_target || 0),
      total_defects: Number(row.total_defects || 0),
      total_downtime_minutes: Number(row.total_downtime_minutes || 0),
      total_records: Number(row.total_records || 0),
    };
  }

  /**
   * Retrieves line counts broken down by status (RUNNING, MAINTENANCE, STOPPED).
   */
  async getLinesBreakdown(): Promise<{
    total: number;
    running: number;
    maintenance: number;
    stopped: number;
  }> {
    const sql = `
      SELECT 
        status,
        COUNT(*) AS count
      FROM production_lines
      GROUP BY status
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql);
    let running = 0;
    let maintenance = 0;
    let stopped = 0;
    let total = 0;

    for (const r of rows) {
      const count = Number(r.count || 0);
      total += count;
      if (r.status === 'RUNNING') running += count;
      else if (r.status === 'MAINTENANCE') maintenance += count;
      else if (r.status === 'STOPPED') stopped += count;
    }

    return { total, running, maintenance, stopped };
  }

  /**
   * Counts active quality issues (status != 'RESOLVED').
   */
  async getActiveQualityIssuesCount(): Promise<number> {
    const sql = "SELECT COUNT(*) AS active_count FROM quality_issues WHERE status != 'RESOLVED'";
    const [rows] = await pool.query<RowDataPacket[]>(sql);
    return Number(rows[0]?.active_count || 0);
  }

  /**
   * Retrieves date-wise production and target values for trend charts.
   */
  async getDailyTrends(from?: string, to?: string): Promise<{
    date: string;
    target: number;
    produced: number;
    defects: number;
    downtime_minutes: number;
  }[]> {
    const conditions: string[] = ['1=1'];
    const params: string[] = [];

    if (from) {
      conditions.push('production_date >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('production_date <= ?');
      params.push(to);
    }

    const sql = `
      SELECT 
        DATE_FORMAT(production_date, '%Y-%m-%d') AS date,
        COALESCE(SUM(target_quantity), 0) AS target,
        COALESCE(SUM(produced_quantity), 0) AS produced,
        COALESCE(SUM(defect_count), 0) AS defects,
        COALESCE(SUM(downtime_minutes), 0) AS downtime_minutes
      FROM production_records
      WHERE ${conditions.join(' AND ')}
      GROUP BY production_date
      ORDER BY production_date ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.map((r) => ({
      date: String(r.date),
      target: Number(r.target || 0),
      produced: Number(r.produced || 0),
      defects: Number(r.defects || 0),
      downtime_minutes: Number(r.downtime_minutes || 0),
    }));
  }
}

export const dashboardRepository = new DashboardRepository();
