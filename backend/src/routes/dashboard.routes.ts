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

// GET /api/dashboard/trends - Daily, weekly, or monthly output vs target trends
router.get(
  '/trends',
  validateRequest(getDashboardTrendsSchema),
  (req, res, next) => dashboardController.getTrends(req, res, next)
);

// GET /api/dashboard/production-by-line - Line performance comparison
router.get(
  '/production-by-line',
  (req, res, next) => dashboardController.getProductionByLine(req, res, next)
);

// GET /api/dashboard/quality-analysis & /api/dashboard/quality-summary - Inspection results (Accepted, Rejected, Pending)
router.get(
  ['/quality-analysis', '/quality-summary'],
  (req, res, next) => dashboardController.getQualityAnalysis(req, res, next)
);

// GET /api/dashboard/defect-analysis - Defect frequency by category
router.get(
  '/defect-analysis',
  (req, res, next) => dashboardController.getDefectAnalysis(req, res, next)
);

// GET /api/dashboard/work-order-status - Work order distribution
router.get(
  '/work-order-status',
  (req, res, next) => dashboardController.getWorkOrderStatus(req, res, next)
);

// GET /api/dashboard/downtime-analysis & /api/dashboard/downtime-summary - Downtime by line, equipment, reasons
router.get(
  ['/downtime-analysis', '/downtime-summary'],
  (req, res, next) => dashboardController.getDowntimeAnalysis(req, res, next)
);

// GET /api/dashboard/oee - Industrial OEE breakdown
router.get(
  '/oee',
  (req, res, next) => dashboardController.getOee(req, res, next)
);

export default router;
