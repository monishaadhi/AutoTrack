import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
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
        COALESCE(pl.factory_id, pl.plant_id, 1) AS factory_id,
        COALESCE(f.name, p.plant_name, 'Main Plant') AS factory_name,
        COALESCE(f.location, p.location, 'Factory Location') AS factory_location,
        COALESCE(pl.name, pl.line_name) AS name,
        pl.line_code,
        pl.status,
        COALESCE(pl.production_capacity, pl.capacity_per_shift, 450) AS production_capacity,
        DATE_FORMAT(pl.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM production_lines pl
      LEFT JOIN factories f ON pl.factory_id = f.factory_id
      LEFT JOIN plants p ON pl.plant_id = p.plant_id
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
        COALESCE(pl.factory_id, pl.plant_id, 1) AS factory_id,
        COALESCE(f.name, p.plant_name, 'Main Plant') AS factory_name,
        COALESCE(f.location, p.location, 'Factory Location') AS factory_location,
        COALESCE(pl.name, pl.line_name) AS name,
        pl.line_code,
        pl.status,
        COALESCE(pl.production_capacity, pl.capacity_per_shift, 450) AS production_capacity,
        DATE_FORMAT(pl.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM production_lines pl
      LEFT JOIN factories f ON pl.factory_id = f.factory_id
      LEFT JOIN plants p ON pl.plant_id = p.plant_id
      WHERE pl.line_id = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, [lineId]);
    return rows.length ? (rows[0] as ProductionLineRow) : null;
  }

  /**
   * Creates a new production line.
   */
  async create(data: {
    factory_id: number;
    name: string;
    line_code?: string;
    status?: string;
    production_capacity?: number;
  }): Promise<number> {
    const sql = `
      INSERT INTO production_lines (factory_id, plant_id, name, line_name, line_code, status, production_capacity, capacity_per_shift)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const plantId = data.factory_id;
    const lineName = data.name;
    const capacity = data.production_capacity || 450;
    const status = data.status || 'RUNNING';
    const lineCode = data.line_code || `LINE-${Date.now().toString().slice(-4)}`;

    const [result] = await pool.query<ResultSetHeader>(sql, [
      data.factory_id,
      plantId,
      lineName,
      lineName,
      lineCode,
      status,
      capacity,
      capacity,
    ]);
    return result.insertId;
  }

  /**
   * Updates an existing production line.
   */
  async update(
    lineId: number,
    data: Partial<{
      name: string;
      status: string;
      production_capacity: number;
      factory_id: number;
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push('name = ?', 'line_name = ?');
      values.push(data.name, data.name);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.production_capacity !== undefined) {
      fields.push('production_capacity = ?', 'capacity_per_shift = ?');
      values.push(data.production_capacity, data.production_capacity);
    }
    if (data.factory_id !== undefined) {
      fields.push('factory_id = ?', 'plant_id = ?');
      values.push(data.factory_id, data.factory_id);
    }

    if (fields.length === 0) return false;

    values.push(lineId);
    const sql = `UPDATE production_lines SET ${fields.join(', ')} WHERE line_id = ?`;
    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Deletes a production line if it has no dependent records.
   */
  async delete(lineId: number): Promise<boolean> {
    const sql = 'DELETE FROM production_lines WHERE line_id = ?';
    const [result] = await pool.query<ResultSetHeader>(sql, [lineId]);
    return result.affectedRows > 0;
  }
}

export const lineRepository = new LineRepository();
