import { Router } from 'express';
import { productionController } from '../controllers/production.controller';
import { validateRequest } from '../middleware/validate';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import {
  getProductionRecordsSchema,
  getProductionRecordByIdSchema,
  createProductionRecordSchema,
  updateProductionRecordSchema,
} from '../validators/production.validator';

const router = Router();

// GET /api/production - List records with pagination and filters
router.get(
  '/',
  validateRequest(getProductionRecordsSchema),
  (req, res, next) => productionController.getRecords(req, res, next)
);

// GET /api/production/:id - Get a single record by ID
router.get(
  '/:id',
  validateRequest(getProductionRecordByIdSchema),
  (req, res, next) => productionController.getRecordById(req, res, next)
);

// POST /api/production - Create a production record (Protected: Operator or Admin)
router.post(
  '/',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  validateRequest(createProductionRecordSchema),
  (req, res, next) => productionController.createRecord(req, res, next)
);

// PUT /api/production/:id - Update an existing production record (Protected: Operator or Admin)
router.put(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN', 'OPERATOR']),
  validateRequest(updateProductionRecordSchema),
  (req, res, next) => productionController.updateRecord(req, res, next)
);

// DELETE /api/production/:id - Delete a record (Protected: Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['ADMIN']),
  validateRequest(getProductionRecordByIdSchema),
  (req, res, next) => productionController.deleteRecord(req, res, next)
);

export default router;
