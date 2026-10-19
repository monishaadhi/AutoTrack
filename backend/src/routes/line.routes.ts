import { Router } from 'express';
import { lineController } from '../controllers/line.controller';
import { validateRequest } from '../middleware/validate';
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

export default router;
