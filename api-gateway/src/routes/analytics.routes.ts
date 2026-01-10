import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

// FEATURE 9: Alert Clustering
router.get('/clusters', AnalyticsController.getAlertClusters);

// FEATURE 10: Predictive Analytics
router.get('/predictive', AnalyticsController.getPredictiveAnalytics);

// FEATURE 11: Report Generation
router.get('/report', AnalyticsController.generateReport);

export default router;
