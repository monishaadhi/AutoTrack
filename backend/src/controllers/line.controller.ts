import { Request, Response, NextFunction } from 'express';
import { lineService } from '../services/line.service';
import { ServiceError } from '../services/production.service';

export class LineController {
  async getLines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const factoryIdParam = req.query.factoryId || req.query.factory_id || req.query.plantId;
      const filters = {
        factoryId: factoryIdParam !== undefined ? Number(factoryIdParam) : undefined,
        status: req.query.status as any,
      };

      const lines = await lineService.getLines(filters);
      res.status(200).json({ data: lines, total: lines.length });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getLineById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const line = await lineService.getLineById(id);
      res.status(200).json(line);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async createLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { factory_id, plant_id, name, line_name, line_code, status, production_capacity, capacity_per_shift } = req.body;
      const targetFactory = factory_id || plant_id || 1;
      const lineName = name || line_name;
      if (!lineName) {
        res.status(400).json({ error: 'Bad Request', message: 'Line name is required' });
        return;
      }
      const capacity = production_capacity !== undefined ? Number(production_capacity) : (capacity_per_shift !== undefined ? Number(capacity_per_shift) : 450);
      const created = await lineService.createLine({
        factory_id: Number(targetFactory),
        name: lineName,
        line_code,
        status,
        production_capacity: capacity,
      });
      res.status(201).json(created);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async updateLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const payload = { ...req.body };
      if (payload.line_name && !payload.name) payload.name = payload.line_name;
      if (payload.capacity_per_shift !== undefined && payload.production_capacity === undefined) {
        payload.production_capacity = payload.capacity_per_shift;
      }
      const updated = await lineService.updateLine(id, payload);
      res.status(200).json(updated);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async deleteLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await lineService.deleteLine(id);
      res.status(200).json({ success: true, message: `Production line #${id} deleted successfully` });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.statusCode === 404 ? 'Not Found' : 'Bad Request',
        message: error.message,
      });
      return;
    }
    console.error('[LineController Error]:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the request.',
    });
  }
}

export const lineController = new LineController();
