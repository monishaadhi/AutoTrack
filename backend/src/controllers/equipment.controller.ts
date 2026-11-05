import { Request, Response, NextFunction } from 'express';
import { equipmentService } from '../services/equipment.service';

export class EquipmentController {
  async getAllEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lineId = req.query.lineId ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId ? Number(req.query.plantId) : undefined;
      const status = req.query.status as string | undefined;

      const equipment = await equipmentService.getAllEquipment({ lineId, plantId, status });
      res.status(200).json({ data: equipment, total: equipment.length });
    } catch (err) {
      console.error('[EquipmentController Error]:', err);
      res.status(500).json({ error: 'Failed to fetch equipment list' });
    }
  }

  async getDowntimeRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const equipmentId = req.query.equipmentId ? Number(req.query.equipmentId) : undefined;
      const lineId = req.query.lineId ? Number(req.query.lineId) : undefined;
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      const records = await equipmentService.getDowntimeRecords({ equipmentId, lineId, from, to, limit });
      res.status(200).json({ data: records, total: records.length });
    } catch (err) {
      console.error('[DowntimeRecords Error]:', err);
      res.status(500).json({ error: 'Failed to fetch downtime records' });
    }
  }

  async getDowntimeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid downtime id' });
        return;
      }
      const record = await equipmentService.getDowntimeById(id);
      if (!record) {
        res.status(404).json({ error: 'Downtime record not found' });
        return;
      }
      res.status(200).json({ data: record });
    } catch (err) {
      console.error('[DowntimeById Error]:', err);
      res.status(500).json({ error: 'Failed to fetch downtime record' });
    }
  }

  async createDowntime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { equipment_id, production_id, line_id, downtime_start, downtime_end, duration_minutes, downtime_reason, start_time, end_time, reason } = req.body;
      const actualStart = downtime_start || start_time;
      const actualEnd = downtime_end || end_time;
      const actualReason = downtime_reason || reason;

      if (!equipment_id || !actualStart || !actualReason) {
        res.status(400).json({ error: 'Missing required fields: equipment_id, downtime_start, downtime_reason' });
        return;
      }

      const created = await equipmentService.createDowntime({
        equipment_id: Number(equipment_id),
        production_id: production_id ? Number(production_id) : undefined,
        line_id: line_id ? Number(line_id) : undefined,
        downtime_start: String(actualStart),
        downtime_end: actualEnd ? String(actualEnd) : undefined,
        duration_minutes: Number(duration_minutes || 0),
        downtime_reason: String(actualReason),
      });

      res.status(201).json({ message: 'Downtime record created successfully', data: created });
    } catch (err) {
      console.error('[CreateDowntime Error]:', err);
      res.status(500).json({ error: 'Failed to create downtime record' });
    }
  }

  async updateDowntime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid downtime id' });
        return;
      }

      const { equipment_id, production_id, downtime_start, downtime_end, duration_minutes, downtime_reason, start_time, end_time, reason } = req.body;
      const actualStart = downtime_start || start_time;
      const actualEnd = downtime_end || end_time;
      const actualReason = downtime_reason || reason;

      const updated = await equipmentService.updateDowntime(id, {
        equipment_id: equipment_id !== undefined ? Number(equipment_id) : undefined,
        production_id: production_id !== undefined ? Number(production_id) : undefined,
        downtime_start: actualStart !== undefined ? String(actualStart) : undefined,
        downtime_end: actualEnd !== undefined ? String(actualEnd) : undefined,
        duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : undefined,
        downtime_reason: actualReason !== undefined ? String(actualReason) : undefined,
      });

      if (!updated) {
        res.status(404).json({ error: 'Downtime record not found' });
        return;
      }

      res.status(200).json({ message: 'Downtime record updated successfully', data: updated });
    } catch (err) {
      console.error('[UpdateDowntime Error]:', err);
      res.status(500).json({ error: 'Failed to update downtime record' });
    }
  }
}

export const equipmentController = new EquipmentController();
