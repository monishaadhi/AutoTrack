import { Request, Response, NextFunction } from 'express';
import { qualityService } from '../services/quality.service';
import { ServiceError } from '../services/production.service';

export class QualityController {
  async getIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        status: req.query.status as any,
        severity: req.query.severity as any,
        category: req.query.category as any,
        from: (req.query.from || req.query.startDate) as string | undefined,
        to: (req.query.to || req.query.endDate) as string | undefined,
        lineId: req.query.lineId !== undefined ? Number(req.query.lineId) : undefined,
        page: req.query.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query.limit !== undefined ? Number(req.query.limit) : 10,
      };

      const result = await qualityService.getIssues(filters);
      res.status(200).json(result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getIssueById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const issue = await qualityService.getIssueById(id);
      res.status(200).json(issue);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async updateIssueStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const updated = await qualityService.updateIssueStatus(id, status);
      res.status(200).json(updated);
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
    console.error('[QualityController Error]:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the quality issue request.',
    });
  }
}

export const qualityController = new QualityController();
