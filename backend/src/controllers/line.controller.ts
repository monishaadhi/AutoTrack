import { Request, Response, NextFunction } from 'express';
import { lineService } from '../services/line.service';
import { ServiceError } from '../services/production.service';

export class LineController {
  async getLines(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const factoryIdParam = req.query.factoryId || req.query.factory_id;
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
