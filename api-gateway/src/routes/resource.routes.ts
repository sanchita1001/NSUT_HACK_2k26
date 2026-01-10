import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller';
import { SchemeController } from '../controllers/scheme.controller';
import { VendorController } from '../controllers/vendor.controller';

const router = Router();

// Read-only routes
router.get('/schemes', SchemeController.getSchemes); // Now includes usage counts
router.get('/vendors', ResourceController.getVendors);
router.get('/audit-logs', ResourceController.getAuditLogs);
router.get('/health', ResourceController.getHealth);

// Scheme CRUD
router.post('/schemes', SchemeController.createScheme);
router.put('/schemes/:id', SchemeController.updateScheme);
router.delete('/schemes/:id', SchemeController.deleteScheme);

// Vendor CRUD
router.post('/vendors', VendorController.createVendor);
router.put('/vendors/:id', VendorController.updateVendor);
router.delete('/vendors/:id', VendorController.deleteVendor);

// FEATURE 8: Vendor Risk Profiling
router.get('/vendors/:id/risk-profile', VendorController.getVendorRiskProfile);

export default router;
