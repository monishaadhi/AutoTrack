import { Request, Response, NextFunction } from 'express';
import { workOrderService } from '../services/workOrder.service';

export class WorkOrderController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plantId = req.query.plantId ? Number(req.query.plantId) : undefined;
      const lineId = req.query.lineId ? Number(req.query.lineId) : undefined;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const orders = await workOrderService.getAll({ plantId, lineId, status, search });
      res.status(200).json({ data: orders, total: orders.length });
    } catch (err) {
      console.error('[WorkOrderController Error]:', err);
      res.status(500).json({ error: 'Failed to fetch work orders' });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const order = await workOrderService.getById(id);
      if (!order) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }
      res.status(200).json(order);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch work order' });
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plant_id, line_id, model_id, work_order_number, planned_quantity, start_date, due_date, status } = req.body;
      if (!plant_id || !line_id || !model_id || !work_order_number || !planned_quantity || !start_date || !due_date) {
        res.status(400).json({ error: 'Missing required work order fields' });
        return;
      }

      const created = await workOrderService.create({
        plant_id: Number(plant_id),
        line_id: Number(line_id),
        model_id: Number(model_id),
        work_order_number,
        planned_quantity: Number(planned_quantity),
        start_date,
        due_date,
        status,
      });

      res.status(201).json(created);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        res.status(409).json({ error: 'Conflict', message: 'Work order number already exists' });
        return;
      }
      console.error('[WorkOrderController Create Error]:', err);
      res.status(500).json({ error: err.message || 'Failed to create work order' });
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const updated = await workOrderService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Work order not found or no changes made' });
        return;
      }
      res.status(200).json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update work order' });
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }
      const updated = await workOrderService.update(id, { status });
      if (!updated) {
        res.status(404).json({ error: 'Work order not found' });
        return;
      }
      res.status(200).json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update work order status' });
    }
  }
}

export const workOrderController = new WorkOrderController();
