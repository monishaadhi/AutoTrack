import { Router } from 'express';
import { lineController } from '../controllers/line.controller';
import { validateRequest } from '../middleware/validate';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { getLinesSchema, getLineByIdSchema } from '../validators/line.validator';

const router = Router();

// GET /api/lines - List production lines with optional factory/status filters
router.get('/', validateRequest(getLinesSchema), (req, res, next) =>
  lineController.getLines(req, res, next)
);

// GET /api/lines/:id - Retrieve single production line
router.get('/:id', validateRequest(getLineByIdSchema), (req, res, next) =>
  lineController.getLineById(req, res, next)
);

// POST /api/lines - Create a production line (Protected: Admin only)
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN']),
  (req, res, next) => lineController.createLine(req, res, next)
);

// PUT /api/lines/:id - Update production line (Protected: Admin only)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  (req, res, next) => lineController.updateLine(req, res, next)
);

// DELETE /api/lines/:id - Delete production line (Protected: Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  (req, res, next) => lineController.deleteLine(req, res, next)
);

export default router;
