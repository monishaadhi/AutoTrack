import { Router } from 'express';
import { workOrderController } from '../controllers/workOrder.controller';

const router = Router();

router.get('/', (req, res, next) => workOrderController.getAll(req, res, next));
router.get('/:id', (req, res, next) => workOrderController.getById(req, res, next));
router.post('/', (req, res, next) => workOrderController.create(req, res, next));
router.put('/:id', (req, res, next) => workOrderController.update(req, res, next));
router.patch('/:id/status', (req, res, next) => workOrderController.updateStatus(req, res, next));

export default router;
