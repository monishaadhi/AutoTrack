import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { validateRequest } from '../middleware/validate';
import {
  getDashboardSummarySchema,
  getDashboardTrendsSchema,
} from '../validators/dashboard.validator';

const router = Router();

// GET /api/dashboard/summary - Real-time aggregated manufacturing KPIs
router.get(
  '/summary',
  validateRequest(getDashboardSummarySchema),
  (req, res, next) => dashboardController.getSummary(req, res, next)
);

// GET /api/dashboard/trends - Daily trend points for output vs target charts
router.get(
  '/trends',
  validateRequest(getDashboardTrendsSchema),
  (req, res, next) => dashboardController.getTrends(req, res, next)
);

export default router;
