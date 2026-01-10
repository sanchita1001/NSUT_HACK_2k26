import { Router } from 'express';
import { NetworkController } from '../controllers/network.controller';

const router = Router();

router.get('/:id', NetworkController.getVendorNetwork);

export default router;
