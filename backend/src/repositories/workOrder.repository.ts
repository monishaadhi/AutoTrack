import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import { WorkOrderDTO } from '../types/enterprise.types';

export class WorkOrderRepository {
  async getAll(params: {
    plantId?: number;
    lineId?: number;
    status?: string;
    search?: string;
  } = {}): Promise<WorkOrderDTO[]> {
    const conditions: string[] = ['1=1'];
    const sqlParams: (string | number)[] = [];

    if (params.plantId) {
      conditions.push('w.plant_id = ?');
      sqlParams.push(params.plantId);
    }
    if (params.lineId) {
      conditions.push('w.line_id = ?');
      sqlParams.push(params.lineId);
    }
    if (params.status) {
      conditions.push('w.status = ?');
      sqlParams.push(params.status.toUpperCase());
    }
    if (params.search) {
      conditions.push('(w.work_order_number LIKE ? OR m.model_name LIKE ?)');
      const term = `%${params.search}%`;
      sqlParams.push(term, term);
    }

    const sql = `
      SELECT 
        w.work_order_id,
        w.plant_id,
        p.plant_name,
        w.line_id,
        l.name AS line_name,
        w.model_id,
        m.model_name,
        m.model_code,
        w.work_order_number,
        w.planned_quantity,
        COALESCE(SUM(pr.produced_quantity), 0) AS completed_quantity,
        DATE_FORMAT(w.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(w.due_date, '%Y-%m-%d') AS due_date,
        w.status,
        w.created_by,
        w.created_at,
        w.updated_at
      FROM work_orders w
      LEFT JOIN plants p ON w.plant_id = p.plant_id
      LEFT JOIN production_lines l ON w.line_id = l.line_id
      LEFT JOIN vehicle_models m ON w.model_id = m.model_id
      LEFT JOIN production_records pr ON w.work_order_id = pr.work_order_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY w.work_order_id, w.plant_id, p.plant_name, w.line_id, l.name, w.model_id, m.model_name, m.model_code, w.work_order_number, w.planned_quantity, w.start_date, w.due_date, w.status, w.created_by, w.created_at, w.updated_at
      ORDER BY w.work_order_id DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, sqlParams);
    return rows.map((r) => ({
      work_order_id: Number(r.work_order_id),
      order_id: Number(r.work_order_id),
      plant_id: Number(r.plant_id),
      plant_name: String(r.plant_name || 'Assembly Complex'),
      line_id: Number(r.line_id),
      line_name: String(r.line_name || 'Line'),
      model_id: Number(r.model_id),
      model_name: String(r.model_name || 'Vehicle Model'),
      model_code: String(r.model_code || 'MOD'),
      work_order_number: String(r.work_order_number),
      planned_quantity: Number(r.planned_quantity),
      completed_quantity: Number(r.completed_quantity || 0),
      start_date: String(r.start_date),
      due_date: String(r.due_date),
      status: r.status,
      created_by: r.created_by ? Number(r.created_by) : undefined,
      created_at: String(r.created_at),
      updated_at: r.updated_at ? String(r.updated_at) : undefined,
    }));
  }

  async getById(id: number): Promise<WorkOrderDTO | null> {
    const sql = `
      SELECT 
        w.work_order_id,
        w.plant_id,
        COALESCE(p.plant_name, 'Assembly Complex') AS plant_name,
        w.line_id,
        COALESCE(l.name, 'Line') AS line_name,
        w.model_id,
        COALESCE(m.model_name, 'Vehicle Model') AS model_name,
        COALESCE(m.model_code, 'MOD') AS model_code,
        w.work_order_number,
        w.planned_quantity,
        COALESCE(SUM(pr.produced_quantity), 0) AS completed_quantity,
        DATE_FORMAT(w.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(w.due_date, '%Y-%m-%d') AS due_date,
        w.status,
        w.created_by,
        w.created_at,
        w.updated_at
      FROM work_orders w
      LEFT JOIN plants p ON w.plant_id = p.plant_id
      LEFT JOIN production_lines l ON w.line_id = l.line_id
      LEFT JOIN vehicle_models m ON w.model_id = m.model_id
      LEFT JOIN production_records pr ON w.work_order_id = pr.work_order_id
      WHERE w.work_order_id = ?
      GROUP BY w.work_order_id, w.plant_id, p.plant_name, w.line_id, l.name, w.model_id, m.model_name, m.model_code, w.work_order_number, w.planned_quantity, w.start_date, w.due_date, w.status, w.created_by, w.created_at, w.updated_at
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      work_order_id: Number(r.work_order_id),
      order_id: Number(r.work_order_id),
      plant_id: Number(r.plant_id),
      plant_name: String(r.plant_name),
      line_id: Number(r.line_id),
      line_name: String(r.line_name),
      model_id: Number(r.model_id),
      model_name: String(r.model_name),
      model_code: String(r.model_code),
      work_order_number: String(r.work_order_number),
      planned_quantity: Number(r.planned_quantity),
      completed_quantity: Number(r.completed_quantity || 0),
      start_date: String(r.start_date),
      due_date: String(r.due_date),
      status: r.status,
      created_by: r.created_by ? Number(r.created_by) : undefined,
      created_at: String(r.created_at),
      updated_at: r.updated_at ? String(r.updated_at) : undefined,
    };
  }

  async create(data: {
    plant_id: number;
    line_id: number;
    model_id: number;
    work_order_number: string;
    planned_quantity: number;
    start_date: string;
    due_date: string;
    status?: string;
  }): Promise<number> {
    const sql = `
      INSERT INTO work_orders (plant_id, line_id, model_id, work_order_number, planned_quantity, start_date, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query<ResultSetHeader>(sql, [
      data.plant_id,
      data.line_id,
      data.model_id,
      data.work_order_number,
      data.planned_quantity,
      data.start_date,
      data.due_date,
      data.status || 'PLANNED',
    ]);
    return result.insertId;
  }

  async update(
    id: number,
    data: Partial<{
      status: string;
      planned_quantity: number;
      due_date: string;
    }>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.status) {
      fields.push('status = ?');
      values.push(data.status.toUpperCase());
    }
    if (data.planned_quantity !== undefined) {
      fields.push('planned_quantity = ?');
      values.push(data.planned_quantity);
    }
    if (data.due_date) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE work_orders SET ${fields.join(', ')} WHERE work_order_id = ?`;
    const [res] = await pool.query<ResultSetHeader>(sql, values);
    return res.affectedRows > 0;
  }
}

export const workOrderRepository = new WorkOrderRepository();
