import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const summary = await dashboardService.getSummary({ from, to, lineId, plantId });
      res.status(200).json(summary);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;
      const aggregation = (req.query.aggregation as 'daily' | 'weekly' | 'monthly') || 'daily';

      const trends = await dashboardService.getTrends({ from, to, lineId, plantId, aggregation });
      res.status(200).json({ data: trends, total: trends.length });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getProductionByLine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const data = await dashboardService.getProductionByLine({ from, to, plantId });
      res.status(200).json({ data });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getQualityAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const data = await dashboardService.getQualityAnalysis({ from, to, lineId, plantId });
      res.status(200).json(data);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getDefectAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const data = await dashboardService.getDefectAnalysis({ from, to, lineId, plantId });
      res.status(200).json({ data });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getWorkOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const data = await dashboardService.getWorkOrderStatusDistribution(plantId, lineId);
      res.status(200).json({ data });
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getDowntimeAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const data = await dashboardService.getDowntimeAnalysis({ from, to, lineId, plantId });
      res.status(200).json(data);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  async getOee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from = (req.query.from || req.query.startDate) as string | undefined;
      const to = (req.query.to || req.query.endDate) as string | undefined;
      const lineId = req.query.lineId !== undefined ? Number(req.query.lineId) : undefined;
      const plantId = req.query.plantId !== undefined ? Number(req.query.plantId) : undefined;

      const data = await dashboardService.getOee({ from, to, lineId, plantId });
      res.status(200).json(data);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  private handleError(error: unknown, res: Response, next: NextFunction): void {
    console.error('[DashboardController Error]:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while calculating dashboard metrics.',
    });
  }
}

export const dashboardController = new DashboardController();
