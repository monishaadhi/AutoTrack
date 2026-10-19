import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import {
  ProductionRecordRow,
  CreateProductionRecordInput,
  UpdateProductionRecordInput,
  ProductionFilterParams,
} from '../types/production.types';

export class ProductionRepository {
  /**
   * Retrieves paginated production records with optional filtering.
   */
  async findMany(
    filters: ProductionFilterParams
  ): Promise<{ rows: ProductionRecordRow[]; total: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.startDate) {
      conditions.push('pr.production_date >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('pr.production_date <= ?');
      params.push(filters.endDate);
    }

    if (filters.lineId) {
      conditions.push('pr.line_id = ?');
      params.push(filters.lineId);
    }

    if (filters.shift) {
      conditions.push('pr.shift = ?');
      params.push(filters.shift);
    }

    const whereClause = conditions.join(' AND ');

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM production_records pr
      WHERE ${whereClause}
    `;
    const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
    const total = Number(countRows[0]?.total || 0);

    // Data query with joins
    const dataSql = `
      SELECT 
        pr.record_id,
        pr.line_id,
        pl.name AS line_name,
        f.factory_id,
        f.name AS factory_name,
        DATE_FORMAT(pr.production_date, '%Y-%m-%d') AS production_date,
        pr.shift,
        pr.target_quantity,
        pr.produced_quantity,
        pr.defect_count,
        pr.downtime_minutes,
        DATE_FORMAT(pr.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(pr.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM production_records pr
      JOIN production_lines pl ON pr.line_id = pl.line_id
      JOIN factories f ON pl.factory_id = f.factory_id
      WHERE ${whereClause}
      ORDER BY pr.production_date DESC, pr.record_id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

    return {
      rows: rows as ProductionRecordRow[],
      total,
    };
  }

  /**
   * Retrieves a single production record by its primary key ID.
   */
  async findById(recordId: number): Promise<ProductionRecordRow | null> {
    const sql = `
      SELECT 
        pr.record_id,
        pr.line_id,
        pl.name AS line_name,
        f.factory_id,
        f.name AS factory_name,
        DATE_FORMAT(pr.production_date, '%Y-%m-%d') AS production_date,
        pr.shift,
        pr.target_quantity,
        pr.produced_quantity,
        pr.defect_count,
        pr.downtime_minutes,
        DATE_FORMAT(pr.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(pr.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
      FROM production_records pr
      JOIN production_lines pl ON pr.line_id = pl.line_id
      JOIN factories f ON pl.factory_id = f.factory_id
      WHERE pr.record_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [recordId]);
    if (!rows.length) {
      return null;
    }
    return rows[0] as ProductionRecordRow;
  }

  /**
   * Checks if a unique line/date/shift record exists (excluding a specific record if updating).
   */
  async findByLineDateShift(
    lineId: number,
    productionDate: string,
    shift: string,
    excludeId?: number
  ): Promise<ProductionRecordRow | null> {
    let sql = `
      SELECT record_id, line_id, production_date, shift
      FROM production_records
      WHERE line_id = ? AND production_date = ? AND shift = ?
    `;
    const params: (string | number)[] = [lineId, productionDate, shift];

    if (excludeId !== undefined) {
      sql += ' AND record_id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows.length ? (rows[0] as ProductionRecordRow) : null;
  }

  /**
   * Verifies whether a given production line exists.
   */
  async lineExists(lineId: number): Promise<boolean> {
    const sql = 'SELECT line_id FROM production_lines WHERE line_id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(sql, [lineId]);
    return rows.length > 0;
  }

  /**
   * Counts related quality issues for a production record.
   */
  async countQualityIssuesByRecordId(recordId: number): Promise<number> {
    const sql = 'SELECT COUNT(*) AS count FROM quality_issues WHERE record_id = ?';
    const [rows] = await pool.query<RowDataPacket[]>(sql, [recordId]);
    return Number(rows[0]?.count || 0);
  }

  /**
   * Inserts a new production record using parameterized SQL.
   */
  async create(data: CreateProductionRecordInput): Promise<number> {
    const sql = `
      INSERT INTO production_records (
        line_id, production_date, shift, target_quantity, produced_quantity, defect_count, downtime_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.line_id,
      data.production_date,
      data.shift,
      data.target_quantity,
      data.produced_quantity,
      data.defect_count ?? 0,
      data.downtime_minutes ?? 0,
    ];

    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.insertId;
  }

  /**
   * Updates an existing production record.
   */
  async update(recordId: number, data: UpdateProductionRecordInput): Promise<boolean> {
    const fields: string[] = [];
    const params: (string | number)[] = [];

    if (data.line_id !== undefined) {
      fields.push('line_id = ?');
      params.push(data.line_id);
    }
    if (data.production_date !== undefined) {
      fields.push('production_date = ?');
      params.push(data.production_date);
    }
    if (data.shift !== undefined) {
      fields.push('shift = ?');
      params.push(data.shift);
    }
    if (data.target_quantity !== undefined) {
      fields.push('target_quantity = ?');
      params.push(data.target_quantity);
    }
    if (data.produced_quantity !== undefined) {
      fields.push('produced_quantity = ?');
      params.push(data.produced_quantity);
    }
    if (data.defect_count !== undefined) {
      fields.push('defect_count = ?');
      params.push(data.defect_count);
    }
    if (data.downtime_minutes !== undefined) {
      fields.push('downtime_minutes = ?');
      params.push(data.downtime_minutes);
    }

    if (fields.length === 0) {
      return false;
    }

    const sql = `
      UPDATE production_records
      SET ${fields.join(', ')}
      WHERE record_id = ?
    `;
    params.push(recordId);

    const [result] = await pool.query<ResultSetHeader>(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * Deletes a production record by ID.
   */
  async delete(recordId: number): Promise<boolean> {
    const sql = 'DELETE FROM production_records WHERE record_id = ?';
    const [result] = await pool.query<ResultSetHeader>(sql, [recordId]);
    return result.affectedRows > 0;
  }
}

export const productionRepository = new ProductionRepository();
