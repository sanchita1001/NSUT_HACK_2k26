import { Router } from 'express';
import { MapController } from '../controllers/map.controller';

const router = Router();

// Get all geospatial data (vendors + alerts)
router.get('/data', MapController.getMapData);

// Get vendors only
router.get('/vendors', MapController.getVendors);

export default router;
