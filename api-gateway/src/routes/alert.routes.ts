import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';

const router = Router();

// Alert routes
router.post('/', AlertController.createAlert);
router.get('/', AlertController.getAlerts);
router.get('/stats', AlertController.getStats);
router.get('/:id', AlertController.getAlertById); // Detail view
router.put('/:id/status', AlertController.updateAlertStatus);

export default router;
