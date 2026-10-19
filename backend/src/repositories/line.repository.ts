import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { ProductionLineRow, LineFilterParams } from '../types/line.types';

export class LineRepository {
  /**
   * Retrieves all production lines with joined factory details, optionally filtered.
   */
  async findMany(filters: LineFilterParams = {}): Promise<ProductionLineRow[]> {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.factoryId !== undefined) {
      conditions.push('pl.factory_id = ?');
      params.push(filters.factoryId);
    }

    if (filters.status) {
      conditions.push('pl.status = ?');
      params.push(filters.status);
    }

    const sql = `
      SELECT 
        pl.line_id,
        pl.factory_id,
        f.name AS factory_name,
        f.location AS factory_location,
        pl.name,
        pl.status,
        DATE_FORMAT(pl.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM production_lines pl
      JOIN factories f ON pl.factory_id = f.factory_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY pl.line_id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as ProductionLineRow[];
  }

  /**
   * Retrieves a single production line by ID with factory information.
   */
  async findById(lineId: number): Promise<ProductionLineRow | null> {
    const sql = `
      SELECT 
        pl.line_id,
        pl.factory_id,
        f.name AS factory_name,
        f.location AS factory_location,
        pl.name,
        pl.status,
        DATE_FORMAT(pl.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM production_lines pl
      JOIN factories f ON pl.factory_id = f.factory_id
      WHERE pl.line_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [lineId]);
    return rows.length ? (rows[0] as ProductionLineRow) : null;
  }
}

export const lineRepository = new LineRepository();
