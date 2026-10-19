import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import { QualityIssueRow, QualityFilterParams, QualityStatus } from '../types/quality.types';

export class QualityRepository {
  /**
   * Retrieves paginated quality issues with joined line and factory information.
   */
  async findMany(
    filters: QualityFilterParams
  ): Promise<{ rows: QualityIssueRow[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.status) {
      conditions.push('qi.status = ?');
      params.push(filters.status);
    }
    if (filters.severity) {
      conditions.push('qi.severity = ?');
      params.push(filters.severity);
    }
    if (filters.category) {
      conditions.push('qi.category = ?');
      params.push(filters.category);
    }
    if (filters.lineId !== undefined) {
      conditions.push('pr.line_id = ?');
      params.push(filters.lineId);
    }
    if (filters.from) {
      conditions.push('pr.production_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push('pr.production_date <= ?');
      params.push(filters.to);
    }

    const whereClause = conditions.join(' AND ');

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM quality_issues qi
      JOIN production_records pr ON qi.record_id = pr.record_id
      WHERE ${whereClause}
    `;
    const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    // Data query with joins
    const dataSql = `
      SELECT 
        qi.issue_id,
        qi.record_id,
        pr.line_id,
        pl.name AS line_name,
        f.factory_id,
        f.name AS factory_name,
        DATE_FORMAT(pr.production_date, '%Y-%m-%d') AS production_date,
        pr.shift,
        qi.category,
        qi.severity,
        qi.status,
        qi.description,
        DATE_FORMAT(qi.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(qi.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM quality_issues qi
      JOIN production_records pr ON qi.record_id = pr.record_id
      JOIN production_lines pl ON pr.line_id = pl.line_id
      JOIN factories f ON pl.factory_id = f.factory_id
      WHERE ${whereClause}
      ORDER BY 
        CASE qi.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
          ELSE 5 
        END ASC,
        qi.issue_id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

    return {
      rows: rows as QualityIssueRow[],
      total,
    };
  }

  /**
   * Retrieves a single quality issue by its primary key ID.
   */
  async findById(issueId: number): Promise<QualityIssueRow | null> {
    const sql = `
      SELECT 
        qi.issue_id,
        qi.record_id,
        pr.line_id,
        pl.name AS line_name,
        f.factory_id,
        f.name AS factory_name,
        DATE_FORMAT(pr.production_date, '%Y-%m-%d') AS production_date,
        pr.shift,
        qi.category,
        qi.severity,
        qi.status,
        qi.description,
        DATE_FORMAT(qi.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(qi.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM quality_issues qi
      JOIN production_records pr ON qi.record_id = pr.record_id
      JOIN production_lines pl ON pr.line_id = pl.line_id
      JOIN factories f ON pl.factory_id = f.factory_id
      WHERE qi.issue_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [issueId]);
    return rows.length ? (rows[0] as QualityIssueRow) : null;
  }

  /**
   * Updates an issue's status.
   */
  async updateStatus(issueId: number, status: QualityStatus): Promise<boolean> {
    const sql = `
      UPDATE quality_issues
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE issue_id = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(sql, [status, issueId]);
    return result.affectedRows > 0;
  }
}

export const qualityRepository = new QualityRepository();
