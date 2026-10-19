import { Request, Response, NextFunction } from 'express';
import { productionService, ServiceError } from '../services/production.service';

export class ProductionController {
  async getRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        lineId: req.query.lineId !== undefined ? Number(req.query.lineId) : undefined,
        shift: req.query.shift as any,
        page: req.query.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query.limit !== undefined ? Number(req.query.limit) : 10,
      };

      const result = await productionService.getRecords(filters);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const record = await productionService.getRecordById(id);
      res.status(200).json(record);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await productionService.createRecord(req.body);
      res.status(201).json(created);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const updated = await productionService.updateRecord(id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const result = await productionService.deleteRecord(id);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private handleError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.statusCode === 404 ? 'Not Found' : error.statusCode === 409 ? 'Conflict' : 'Bad Request',
        message: error.message,
      });
      return;
    }

    const mysqlError = error as { code?: string; errno?: number; message?: string };
    if (mysqlError.code === 'ER_DUP_ENTRY' || mysqlError.errno === 1062) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A duplicate record with the same line, date, and shift already exists.',
      });
      return;
    }

    if (mysqlError.code === 'ER_ROW_IS_REFERENCED_2' || mysqlError.errno === 1451) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete or modify record because related quality issues depend on it.',
      });
      return;
    }

    if (mysqlError.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || mysqlError.errno === 3819) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid numeric value: production quantities, defects and downtime must be non-negative.',
      });
      return;
    }

    console.error('[ProductionController Error]:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the request.',
    });
  }
}

export const productionController = new ProductionController();
