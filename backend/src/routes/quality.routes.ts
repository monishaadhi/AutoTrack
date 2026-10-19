import { Router } from 'express';
import { qualityController } from '../controllers/quality.controller';
import { validateRequest } from '../middleware/validate';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import {
  getQualityIssuesSchema,
  getQualityIssueByIdSchema,
  updateQualityIssueStatusSchema,
} from '../validators/quality.validator';

const router = Router();

// GET /api/quality-issues - List issues with status, severity, category, and date filters
router.get(
  '/',
  validateRequest(getQualityIssuesSchema),
  (req, res, next) => qualityController.getIssues(req, res, next)
);

// GET /api/quality-issues/:id - Retrieve single issue
router.get(
  '/:id',
  validateRequest(getQualityIssueByIdSchema),
  (req, res, next) => qualityController.getIssueById(req, res, next)
);

// PATCH /api/quality-issues/:id/status - Update issue status (Protected: Operator or Admin)
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  validateRequest(updateQualityIssueStatusSchema),
  (req, res, next) => qualityController.updateIssueStatus(req, res, next)
);

export default router;
