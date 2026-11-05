import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { DashboardFilterParams } from '../types/dashboard.types';
import {
  QualityAnalysisDTO,
  DefectAnalysisDTO,
  WorkOrderStatusDistributionDTO,
  ProductionByLineDTO,
  DowntimeAnalysisDTO,
  OeeBreakdownDTO,
} from '../types/enterprise.types';
import { calculateIndustrialOee } from '../utils/calculations';

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
    total_good: number;
  }> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.from) {
      conditions.push('r.production_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('r.production_date <= ?');
      params.push(filters.to);
    }
    if (filters.lineId !== undefined) {
      conditions.push('r.line_id = ?');
      params.push(filters.lineId);
    }
    if (filters.plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(filters.plantId, filters.plantId);
    }

    const sql = `
      SELECT 
        COALESCE(SUM(r.produced_quantity), 0) AS total_produced,
        COALESCE(SUM(r.target_quantity), 0) AS total_target,
        COALESCE(SUM(r.defect_count), 0) AS total_defects,
        COALESCE(SUM(r.good_quantity), COALESCE(SUM(r.produced_quantity - r.defect_count), 0)) AS total_good,
        COALESCE(SUM(r.downtime_minutes), 0) AS total_downtime_minutes,
        COUNT(*) AS total_records
      FROM production_records r
      JOIN production_lines l ON r.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    const row = rows[0] || {};

    return {
      total_produced: Number(row.total_produced || 0),
      total_target: Number(row.total_target || 0),
      total_defects: Number(row.total_defects || 0),
      total_good: Number(row.total_good || 0),
      total_downtime_minutes: Number(row.total_downtime_minutes || 0),
      total_records: Number(row.total_records || 0),
    };
  }

  /**
   * Retrieves production quantity for the latest single active production date.
   */
  async getDailyProduction(filters: DashboardFilterParams): Promise<number> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(filters.plantId, filters.plantId);
    }
    if (filters.lineId !== undefined) {
      conditions.push('r.line_id = ?');
      params.push(filters.lineId);
    }

    let targetDate = filters.to;
    if (!targetDate) {
      const [maxRows] = await pool.query<RowDataPacket[]>(
        'SELECT MAX(production_date) as max_date FROM production_records'
      );
      targetDate = maxRows[0]?.max_date ? new Date(maxRows[0].max_date).toISOString().split('T')[0] : '2026-10-31';
    }

    conditions.push('r.production_date = ?');
    params.push(targetDate);

    const sql = `
      SELECT COALESCE(SUM(r.produced_quantity), 0) as daily_prod
      FROM production_records r
      JOIN production_lines l ON r.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return Number(rows[0]?.daily_prod || 0);
  }

  /**
   * Retrieves line counts broken down by status (RUNNING, MAINTENANCE, STOPPED).
   */
  async getLinesBreakdown(plantId?: number): Promise<{
    total: number;
    running: number;
    maintenance: number;
    stopped: number;
  }> {
    const conditions: string[] = ['1=1'];
    const params: number[] = [];

    if (plantId !== undefined) {
      conditions.push('(plant_id = ? OR factory_id = ?)');
      params.push(plantId, plantId);
    }

    const sql = `
      SELECT 
        status,
        COUNT(*) AS count
      FROM production_lines
      WHERE ${conditions.join(' AND ')}
      GROUP BY status
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    let running = 0;
    let maintenance = 0;
    let stopped = 0;
    let total = 0;

    for (const r of rows) {
      const count = Number(r.count || 0);
      total += count;
      const st = String(r.status).toUpperCase();
      if (st === 'RUNNING') running += count;
      else if (st === 'MAINTENANCE') maintenance += count;
      else if (st === 'STOPPED') stopped += count;
    }

    return { total, running, maintenance, stopped };
  }

  /**
   * Counts active quality issues.
   */
  async getActiveQualityIssuesCount(plantId?: number): Promise<number> {
    const conditions: string[] = ["qi.status != 'RESOLVED'"];
    const params: number[] = [];

    if (plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(plantId, plantId);
    }

    const sql = `
      SELECT COUNT(*) AS active_count
      FROM quality_issues qi
      JOIN production_records pr ON qi.record_id = pr.record_id
      JOIN production_lines l ON pr.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return Number(rows[0]?.active_count || 0);
  }

  /**
   * Retrieves date-wise production and target values for trend charts (Daily, Weekly, Monthly).
   */
  async getDailyTrends(
    from?: string,
    to?: string,
    plantId?: number,
    lineId?: number,
    aggregation: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<{
    date: string;
    target: number;
    produced: number;
    defects: number;
    downtime_minutes: number;
    variance: number;
  }[]> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (from) {
      conditions.push('r.production_date >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('r.production_date <= ?');
      params.push(to);
    }
    if (lineId !== undefined) {
      conditions.push('r.line_id = ?');
      params.push(lineId);
    }
    if (plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(plantId, plantId);
    }

    let dateExpr = "DATE_FORMAT(r.production_date, '%Y-%m-%d')";
    let groupByExpr = 'r.production_date';

    if (aggregation === 'weekly') {
      dateExpr = "CONCAT('Wk ', WEEK(r.production_date, 1), ' (', DATE_FORMAT(MIN(r.production_date), '%b %d'), ')') ";
      groupByExpr = 'YEAR(r.production_date), WEEK(r.production_date, 1)';
    } else if (aggregation === 'monthly') {
      dateExpr = "DATE_FORMAT(r.production_date, '%Y-%m')";
      groupByExpr = "DATE_FORMAT(r.production_date, '%Y-%m')";
    }

    const sql = `
      SELECT 
        ${dateExpr} AS date,
        COALESCE(SUM(r.target_quantity), 0) AS target,
        COALESCE(SUM(r.produced_quantity), 0) AS produced,
        COALESCE(SUM(r.defect_count), 0) AS defects,
        COALESCE(SUM(r.downtime_minutes), 0) AS downtime_minutes,
        COALESCE(SUM(r.produced_quantity - r.target_quantity), 0) AS variance
      FROM production_records r
      JOIN production_lines l ON r.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY ${groupByExpr}
      ORDER BY MIN(r.production_date) ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.map((r) => ({
      date: String(r.date),
      target: Number(r.target || 0),
      produced: Number(r.produced || 0),
      defects: Number(r.defects || 0),
      downtime_minutes: Number(r.downtime_minutes || 0),
      variance: Number(r.variance || 0),
    }));
  }

  /**
   * Graph 2: Production Line Comparison
   */
  async getProductionByLine(from?: string, to?: string, plantId?: number): Promise<ProductionByLineDTO[]> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (from) {
      conditions.push('r.production_date >= ?');
      params.push(from);
    }
    if (to) {
      conditions.push('r.production_date <= ?');
      params.push(to);
    }
    if (plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(plantId, plantId);
    }

    const sql = `
      SELECT 
        l.line_id,
        COALESCE(l.line_code, CONCAT('LINE-', l.line_id)) AS line_code,
        l.name AS line_name,
        COALESCE(l.plant_id, l.factory_id) AS plant_id,
        COALESCE(p.plant_name, f.name, 'Main Plant') AS plant_name,
        COALESCE(SUM(r.target_quantity), 0) AS target_quantity,
        COALESCE(SUM(r.produced_quantity), 0) AS produced_quantity,
        l.status
      FROM production_lines l
      LEFT JOIN plants p ON l.plant_id = p.plant_id
      LEFT JOIN factories f ON l.factory_id = f.factory_id
      LEFT JOIN production_records r ON l.line_id = r.line_id AND ${conditions.join(' AND ')}
      GROUP BY l.line_id, l.line_code, l.name, l.plant_id, l.factory_id, p.plant_name, f.name, l.status
      ORDER BY l.line_id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.map((r) => {
      const target = Number(r.target_quantity || 0);
      const produced = Number(r.produced_quantity || 0);
      const achievement = target > 0 ? Number(((produced / target) * 100).toFixed(1)) : 0;
      return {
        line_id: Number(r.line_id),
        line_code: String(r.line_code),
        line_name: String(r.line_name),
        plant_id: Number(r.plant_id || 1),
        plant_name: String(r.plant_name),
        target_quantity: target,
        produced_quantity: produced,
        achievement_percentage: achievement,
        status: String(r.status),
      };
    });
  }

  /**
   * Graph 3: Quality Analysis (Inspection breakdown)
   */
  async getQualityAnalysis(filters: DashboardFilterParams): Promise<QualityAnalysisDTO> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.from) {
      conditions.push('qi.inspection_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('qi.inspection_date <= ?');
      params.push(filters.to);
    }
    if (filters.lineId !== undefined) {
      conditions.push('pr.line_id = ?');
      params.push(filters.lineId);
    }
    if (filters.plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(filters.plantId, filters.plantId);
    }

    const sql = `
      SELECT 
        COALESCE(SUM(qi.accepted_quantity), 0) AS accepted_count,
        COALESCE(SUM(qi.rejected_quantity), 0) AS rejected_count,
        COALESCE(SUM(CASE WHEN qi.inspection_status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_count,
        COUNT(*) AS total_inspections
      FROM quality_inspections qi
      JOIN production_records pr ON qi.production_id = pr.record_id
      JOIN production_lines l ON pr.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    const row = rows[0] || {};
    const accepted = Number(row.accepted_count || 0);
    const rejected = Number(row.rejected_count || 0);
    const pending = Number(row.pending_count || 0);
    const total = accepted + rejected + pending || 1;

    return {
      accepted_count: accepted,
      rejected_count: rejected,
      pending_count: pending,
      total_inspections: Number(row.total_inspections || 0),
      accepted_percentage: Number(((accepted / total) * 100).toFixed(1)),
      rejected_percentage: Number(((rejected / total) * 100).toFixed(1)),
      pending_percentage: Number(((pending / total) * 100).toFixed(1)),
    };
  }

  /**
   * Graph 4: Defect Analysis (Top manufacturing defects)
   */
  async getDefectAnalysis(filters: DashboardFilterParams): Promise<DefectAnalysisDTO[]> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.from) {
      conditions.push('qi.reported_at >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('qi.reported_at <= ?');
      params.push(filters.to);
    }
    if (filters.lineId !== undefined) {
      conditions.push('pr.line_id = ?');
      params.push(filters.lineId);
    }
    if (filters.plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(filters.plantId, filters.plantId);
    }

    const sql = `
      SELECT 
        t.category_name,
        t.severity,
        COUNT(*) AS defect_count
      FROM (
        SELECT 
          COALESCE(dc.category_name, qi.category, 'General Manufacturing') AS category_name,
          COALESCE(dc.severity_level, qi.severity, 'MEDIUM') AS severity
        FROM quality_issues qi
        LEFT JOIN defect_categories dc ON qi.defect_category_id = dc.defect_category_id
        JOIN production_records pr ON qi.record_id = pr.record_id
        JOIN production_lines l ON pr.line_id = l.line_id
        WHERE ${conditions.join(' AND ')}
      ) t
      GROUP BY t.category_name, t.severity
      ORDER BY defect_count DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    const totalDefects = rows.reduce((acc, r) => acc + Number(r.defect_count || 0), 0) || 1;

    return rows.map((r) => ({
      category_name: String(r.category_name),
      defect_count: Number(r.defect_count || 0),
      severity: String(r.severity),
      percentage: Number(((Number(r.defect_count || 0) / totalDefects) * 100).toFixed(1)),
    }));
  }

  /**
   * Graph 5: Production Status Distribution (Work Order status)
   */
  async getWorkOrderStatusDistribution(plantId?: number, lineId?: number): Promise<WorkOrderStatusDistributionDTO[]> {
    const conditions: string[] = ['1=1'];
    const params: number[] = [];

    if (plantId !== undefined) {
      conditions.push('plant_id = ?');
      params.push(plantId);
    }
    if (lineId !== undefined) {
      conditions.push('line_id = ?');
      params.push(lineId);
    }

    const sql = `
      SELECT status, COUNT(*) as count
      FROM work_orders
      WHERE ${conditions.join(' AND ')}
      GROUP BY status
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    const total = rows.reduce((acc, r) => acc + Number(r.count || 0), 0) || 1;

    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count || 0),
      percentage: Number(((Number(r.count || 0) / total) * 100).toFixed(1)),
    }));
  }

  /**
   * Graph 6: Downtime Analysis
   */
  async getDowntimeAnalysis(filters: DashboardFilterParams): Promise<DowntimeAnalysisDTO> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.from) {
      conditions.push('dt.downtime_start >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('dt.downtime_start <= ?');
      params.push(filters.to);
    }
    if (filters.lineId !== undefined) {
      conditions.push('eq.line_id = ?');
      params.push(filters.lineId);
    }
    if (filters.plantId !== undefined) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      params.push(filters.plantId, filters.plantId);
    }

    // By Line
    const lineSql = `
      SELECT 
        l.line_id,
        l.name AS line_name,
        COALESCE(SUM(dt.duration_minutes), 0) AS total_downtime_minutes
      FROM downtime_records dt
      JOIN equipment eq ON dt.equipment_id = eq.equipment_id
      JOIN production_lines l ON eq.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY l.line_id, l.name
      ORDER BY total_downtime_minutes DESC
    `;
    const [lineRows] = await pool.query<RowDataPacket[]>(lineSql, params);

    // By Equipment
    const eqSql = `
      SELECT 
        eq.equipment_id,
        eq.equipment_name,
        COALESCE(SUM(dt.duration_minutes), 0) AS total_downtime_minutes,
        COUNT(*) AS incident_count
      FROM downtime_records dt
      JOIN equipment eq ON dt.equipment_id = eq.equipment_id
      JOIN production_lines l ON eq.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY eq.equipment_id, eq.equipment_name
      ORDER BY total_downtime_minutes DESC
      LIMIT 6
    `;
    const [eqRows] = await pool.query<RowDataPacket[]>(eqSql, params);

    // Top Reasons
    const reasonSql = `
      SELECT 
        dt.downtime_reason AS reason,
        COALESCE(SUM(dt.duration_minutes), 0) AS total_minutes,
        COUNT(*) AS incident_count
      FROM downtime_records dt
      JOIN equipment eq ON dt.equipment_id = eq.equipment_id
      JOIN production_lines l ON eq.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY dt.downtime_reason
      ORDER BY total_minutes DESC
      LIMIT 6
    `;
    const [reasonRows] = await pool.query<RowDataPacket[]>(reasonSql, params);

    return {
      by_line: lineRows.map((r) => ({
        line_id: Number(r.line_id),
        line_name: String(r.line_name),
        total_downtime_minutes: Number(r.total_downtime_minutes || 0),
      })),
      by_equipment: eqRows.map((r) => ({
        equipment_id: Number(r.equipment_id),
        equipment_name: String(r.equipment_name),
        total_downtime_minutes: Number(r.total_downtime_minutes || 0),
        incident_count: Number(r.incident_count || 0),
      })),
      top_reasons: reasonRows.map((r) => ({
        reason: String(r.reason),
        total_minutes: Number(r.total_minutes || 0),
        incident_count: Number(r.incident_count || 0),
      })),
    };
  }

  /**
   * Graph 7: OEE Analysis
   */
  async getOeeMetrics(filters: DashboardFilterParams): Promise<OeeBreakdownDTO> {
    const agg = await this.getAggregateMetrics(filters);

    // In industrial automotive manufacturing, standard shifts are 8 hours = 480 minutes per record
    const plannedMinutes = (agg.total_records || 1) * 480;
    const downtimeMinutes = agg.total_downtime_minutes;
    const idealCycleSeconds = 62.0; // Mean cycle time across models

    const oeeResult = calculateIndustrialOee({
      plannedMinutes,
      downtimeMinutes,
      idealCycleTimeSeconds: idealCycleSeconds,
      totalCount: agg.total_produced,
      goodCount: agg.total_good,
    });

    return {
      availability: oeeResult.availability,
      performance: oeeResult.performance,
      quality: oeeResult.quality,
      oee: oeeResult.oee,
      operating_time_minutes: Math.max(0, plannedMinutes - downtimeMinutes),
      planned_time_minutes: plannedMinutes,
      downtime_minutes: downtimeMinutes,
      total_units: agg.total_produced,
      good_units: agg.total_good,
      scrap_units: agg.total_defects,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
