import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller';

const router = Router();

router.get('/', (req, res, next) => equipmentController.getDowntimeRecords(req, res, next));
router.get('/:id', (req, res, next) => equipmentController.getDowntimeById(req, res, next));
router.post('/', (req, res, next) => equipmentController.createDowntime(req, res, next));
router.put('/:id', (req, res, next) => equipmentController.updateDowntime(req, res, next));

export default router;
