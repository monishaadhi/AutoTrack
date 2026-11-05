import { Router } from 'express';
import { equipmentController } from '../controllers/equipment.controller';

const router = Router();

router.get('/', (req, res, next) => equipmentController.getAllEquipment(req, res, next));
router.get('/downtime', (req, res, next) => equipmentController.getDowntimeRecords(req, res, next));
router.get('/downtime/:id', (req, res, next) => equipmentController.getDowntimeById(req, res, next));
router.post('/downtime', (req, res, next) => equipmentController.createDowntime(req, res, next));
router.put('/downtime/:id', (req, res, next) => equipmentController.updateDowntime(req, res, next));

export default router;
