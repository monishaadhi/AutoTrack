import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/database';
import { EquipmentDTO, DowntimeRecordDTO } from '../types/enterprise.types';

export class EquipmentRepository {
  async getAllEquipment(params: {
    lineId?: number;
    plantId?: number;
    status?: string;
  } = {}): Promise<EquipmentDTO[]> {
    const conditions: string[] = ['1=1'];
    const sqlParams: (string | number)[] = [];

    if (params.lineId) {
      conditions.push('eq.line_id = ?');
      sqlParams.push(params.lineId);
    }
    if (params.plantId) {
      conditions.push('(l.plant_id = ? OR l.factory_id = ?)');
      sqlParams.push(params.plantId, params.plantId);
    }
    if (params.status) {
      conditions.push('eq.status = ?');
      sqlParams.push(params.status.toUpperCase());
    }

    const sql = `
      SELECT 
        eq.equipment_id,
        eq.line_id,
        l.name AS line_name,
        COALESCE(l.plant_id, l.factory_id) AS plant_id,
        COALESCE(p.plant_name, f.name, 'Main Plant') AS plant_name,
        eq.equipment_code,
        eq.equipment_name,
        eq.equipment_type,
        eq.status,
        eq.created_at,
        eq.updated_at
      FROM equipment eq
      JOIN production_lines l ON eq.line_id = l.line_id
      LEFT JOIN plants p ON l.plant_id = p.plant_id
      LEFT JOIN factories f ON l.factory_id = f.factory_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY eq.line_id ASC, eq.equipment_id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, sqlParams);
    return rows.map((r) => ({
      equipment_id: Number(r.equipment_id),
      line_id: Number(r.line_id),
      line_name: String(r.line_name),
      plant_id: Number(r.plant_id || 1),
      plant_name: String(r.plant_name),
      equipment_code: String(r.equipment_code),
      equipment_name: String(r.equipment_name),
      equipment_type: String(r.equipment_type),
      status: r.status,
      created_at: String(r.created_at),
      updated_at: r.updated_at ? String(r.updated_at) : undefined,
    }));
  }

  async getDowntimeRecords(params: {
    equipmentId?: number;
    lineId?: number;
    from?: string;
    to?: string;
    limit?: number;
  } = {}): Promise<DowntimeRecordDTO[]> {
    const conditions: string[] = ['1=1'];
    const sqlParams: (string | number)[] = [];

    if (params.equipmentId) {
      conditions.push('dt.equipment_id = ?');
      sqlParams.push(params.equipmentId);
    }
    if (params.lineId) {
      conditions.push('eq.line_id = ?');
      sqlParams.push(params.lineId);
    }
    if (params.from) {
      conditions.push('dt.downtime_start >= ?');
      sqlParams.push(params.from);
    }
    if (params.to) {
      conditions.push('dt.downtime_start <= ?');
      sqlParams.push(params.to);
    }

    const limit = Math.min(100, Math.max(1, params.limit || 50));

    const sql = `
      SELECT 
        dt.downtime_id,
        dt.equipment_id,
        eq.equipment_code,
        eq.equipment_name,
        eq.line_id,
        l.name AS line_name,
        dt.production_id,
        DATE_FORMAT(dt.downtime_start, '%Y-%m-%d %H:%i') AS downtime_start,
        DATE_FORMAT(dt.downtime_end, '%Y-%m-%d %H:%i') AS downtime_end,
        dt.duration_minutes,
        dt.downtime_reason,
        dt.created_at
      FROM downtime_records dt
      JOIN equipment eq ON dt.equipment_id = eq.equipment_id
      JOIN production_lines l ON eq.line_id = l.line_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY dt.downtime_start DESC
      LIMIT ${limit}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql, sqlParams);
    return rows.map((r) => ({
      downtime_id: Number(r.downtime_id),
      equipment_id: Number(r.equipment_id),
      equipment_code: String(r.equipment_code),
      equipment_name: String(r.equipment_name),
      line_id: Number(r.line_id),
      line_name: String(r.line_name),
      production_id: r.production_id ? Number(r.production_id) : undefined,
      downtime_start: String(r.downtime_start),
      downtime_end: r.downtime_end ? String(r.downtime_end) : undefined,
      duration_minutes: Number(r.duration_minutes),
      downtime_reason: String(r.downtime_reason),
      created_at: String(r.created_at),
    }));
  }

  async getDowntimeById(id: number): Promise<DowntimeRecordDTO | null> {
    const sql = `
      SELECT 
        dt.downtime_id,
        dt.equipment_id,
        eq.equipment_code,
        eq.equipment_name,
        eq.line_id,
        l.name AS line_name,
        dt.production_id,
        DATE_FORMAT(COALESCE(dt.downtime_start, dt.start_time), '%Y-%m-%d %H:%i') AS downtime_start,
        DATE_FORMAT(COALESCE(dt.downtime_end, dt.end_time), '%Y-%m-%d %H:%i') AS downtime_end,
        dt.duration_minutes,
        COALESCE(dt.downtime_reason, dt.reason, 'Unspecified') AS downtime_reason,
        dt.created_at
      FROM downtime_records dt
      JOIN equipment eq ON dt.equipment_id = eq.equipment_id
      JOIN production_lines l ON eq.line_id = l.line_id
      WHERE dt.downtime_id = ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);
    if (!rows.length) return null;
    const r = rows[0];
    return {
      downtime_id: Number(r.downtime_id),
      equipment_id: Number(r.equipment_id),
      equipment_code: String(r.equipment_code),
      equipment_name: String(r.equipment_name),
      line_id: Number(r.line_id),
      line_name: String(r.line_name),
      production_id: r.production_id ? Number(r.production_id) : undefined,
      downtime_start: String(r.downtime_start),
      downtime_end: r.downtime_end ? String(r.downtime_end) : undefined,
      duration_minutes: Number(r.duration_minutes),
      downtime_reason: String(r.downtime_reason),
      created_at: String(r.created_at),
    };
  }

  async createDowntime(data: {
    equipment_id: number;
    production_id?: number;
    line_id?: number;
    downtime_start: string;
    downtime_end?: string;
    duration_minutes: number;
    downtime_reason: string;
  }): Promise<DowntimeRecordDTO> {
    let lineId = data.line_id;
    if (!lineId) {
      const [eqRows] = await pool.query<RowDataPacket[]>(
        'SELECT line_id FROM equipment WHERE equipment_id = ?',
        [data.equipment_id]
      );
      if (eqRows.length > 0) {
        lineId = Number(eqRows[0].line_id);
      }
    }

    const sql = `
      INSERT INTO downtime_records (
        equipment_id, production_id, line_id,
        downtime_start, start_time,
        downtime_end, end_time,
        duration_minutes, downtime_reason, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const startVal = data.downtime_start;
    const endVal = data.downtime_end || null;
    const reasonVal = data.downtime_reason;

    const [result] = await pool.query<ResultSetHeader>(sql, [
      data.equipment_id,
      data.production_id || null,
      lineId || null,
      startVal,
      startVal,
      endVal,
      endVal,
      data.duration_minutes,
      reasonVal,
      reasonVal,
    ]);

    const created = await this.getDowntimeById(result.insertId);
    if (!created) {
      throw new Error('Failed to retrieve created downtime record');
    }
    return created;
  }

  async updateDowntime(
    id: number,
    data: {
      equipment_id?: number;
      production_id?: number;
      downtime_start?: string;
      downtime_end?: string;
      duration_minutes?: number;
      downtime_reason?: string;
    }
  ): Promise<DowntimeRecordDTO | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.equipment_id !== undefined) {
      fields.push('equipment_id = ?');
      values.push(data.equipment_id);
    }
    if (data.production_id !== undefined) {
      fields.push('production_id = ?');
      values.push(data.production_id);
    }
    if (data.downtime_start !== undefined) {
      fields.push('downtime_start = ?', 'start_time = ?');
      values.push(data.downtime_start, data.downtime_start);
    }
    if (data.downtime_end !== undefined) {
      fields.push('downtime_end = ?', 'end_time = ?');
      values.push(data.downtime_end, data.downtime_end);
    }
    if (data.duration_minutes !== undefined) {
      fields.push('duration_minutes = ?');
      values.push(data.duration_minutes);
    }
    if (data.downtime_reason !== undefined) {
      fields.push('downtime_reason = ?', 'reason = ?');
      values.push(data.downtime_reason, data.downtime_reason);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE downtime_records SET ${fields.join(', ')} WHERE downtime_id = ?`, values);
    }

    return this.getDowntimeById(id);
  }
}

export const equipmentRepository = new EquipmentRepository();
