import { Request, Response } from 'express';
import { Alert } from '../models';

export class AnalyticsController {
    // ===== FEATURE 9: ALERT CLUSTERING =====
    static async getAlertClusters(req: Request, res: Response) {
        try {
            const alerts = await Alert.find().sort({ timestamp: -1 });

            // Cluster by vendor
            const vendorClusters: Record<string, any[]> = {};
            alerts.forEach(alert => {
                if (!vendorClusters[alert.vendor]) {
                    vendorClusters[alert.vendor] = [];
                }
                vendorClusters[alert.vendor].push(alert);
            });

            // Find suspicious clusters (5+ alerts from same vendor)
            const suspiciousClusters = Object.entries(vendorClusters)
                .filter(([vendor, alerts]) => alerts.length >= 5)
                .map(([vendor, alerts]) => ({
                    vendor,
                    alertCount: alerts.length,
                    totalAmount: alerts.reduce((sum, a) => sum + a.amount, 0),
                    avgRiskScore: alerts.reduce((sum, a) => sum + a.riskScore, 0) / alerts.length,
                    pattern: 'High Frequency'
                }));

            // Cluster by scheme
            const schemeClusters: Record<string, any[]> = {};
            alerts.forEach(alert => {
                if (!schemeClusters[alert.scheme]) {
                    schemeClusters[alert.scheme] = [];
                }
                schemeClusters[alert.scheme].push(alert);
            });

            res.json({
                totalClusters: suspiciousClusters.length,
                suspiciousClusters,
                vendorDistribution: Object.keys(vendorClusters).length,
                schemeDistribution: Object.keys(schemeClusters).length
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // ===== FEATURE 10: PREDICTIVE ANALYTICS =====
    static async getPredictiveAnalytics(req: Request, res: Response) {
        try {
            const alerts = await Alert.find().sort({ timestamp: -1 });

            // Calculate fraud rate by month
            const monthlyData: Record<string, { total: number, fraud: number }> = {};
            alerts.forEach(alert => {
                const month = alert.date.substring(0, 7); // YYYY-MM
                if (!monthlyData[month]) {
                    monthlyData[month] = { total: 0, fraud: 0 };
                }
                monthlyData[month].total++;
                if (alert.riskScore > 70) {
                    monthlyData[month].fraud++;
                }
            });

            const fraudTrend = Object.entries(monthlyData).map(([month, data]) => ({
                month,
                fraudRate: ((data.fraud / data.total) * 100).toFixed(2),
                totalTransactions: data.total
            }));

            // Top risky agencies
            const agencyRisk: Record<string, { count: number, totalRisk: number }> = {};
            alerts.forEach(alert => {
                if (!agencyRisk[alert.scheme]) {
                    agencyRisk[alert.scheme] = { count: 0, totalRisk: 0 };
                }
                agencyRisk[alert.scheme].count++;
                agencyRisk[alert.scheme].totalRisk += alert.riskScore;
            });

            const topRiskyAgencies = Object.entries(agencyRisk)
                .map(([agency, data]) => ({
                    agency,
                    avgRisk: (data.totalRisk / data.count).toFixed(1),
                    transactionCount: data.count
                }))
                .sort((a, b) => parseFloat(b.avgRisk) - parseFloat(a.avgRisk))
                .slice(0, 5);

            // Geographic hotspots
            const districtRisk: Record<string, { count: number, highRisk: number }> = {};
            alerts.forEach(alert => {
                if (!districtRisk[alert.district]) {
                    districtRisk[alert.district] = { count: 0, highRisk: 0 };
                }
                districtRisk[alert.district].count++;
                if (alert.riskScore > 70) {
                    districtRisk[alert.district].highRisk++;
                }
            });

            const geographicHotspots = Object.entries(districtRisk)
                .map(([district, data]) => ({
                    district,
                    totalAlerts: data.count,
                    highRiskAlerts: data.highRisk,
                    riskPercentage: ((data.highRisk / data.count) * 100).toFixed(1)
                }))
                .sort((a, b) => b.highRiskAlerts - a.highRiskAlerts);

            res.json({
                fraudTrend,
                topRiskyAgencies,
                geographicHotspots,
                summary: {
                    totalAlerts: alerts.length,
                    highRiskAlerts: alerts.filter(a => a.riskScore > 70).length,
                    averageRiskScore: (alerts.reduce((sum, a) => sum + a.riskScore, 0) / alerts.length).toFixed(1)
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // ===== FEATURE 11: REPORT GENERATION =====
    static async generateReport(req: Request, res: Response) {
        try {
            const { month } = req.query; // Format: YYYY-MM

            const startDate = month ? `${month}-01` : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const endDate = month ? `${month}-31` : new Date().toISOString().split('T')[0];

            const alerts = await Alert.find({
                date: { $gte: startDate, $lte: endDate }
            });

            const verifiedFrauds = alerts.filter(a => a.status === 'Verified');
            const totalAmount = alerts.reduce((sum, a) => sum + a.amount, 0);
            const recoveredAmount = verifiedFrauds.reduce((sum, a) => sum + a.amount, 0);

            // Top offenders
            const vendorStats: Record<string, number> = {};
            verifiedFrauds.forEach(alert => {
                vendorStats[alert.vendor] = (vendorStats[alert.vendor] || 0) + 1;
            });

            const topOffenders = Object.entries(vendorStats)
                .map(([vendor, count]) => ({ vendor, fraudCount: count }))
                .sort((a, b) => b.fraudCount - a.fraudCount)
                .slice(0, 10);

            const report = {
                period: month || 'Last 30 days',
                summary: {
                    totalAlerts: alerts.length,
                    verifiedFrauds: verifiedFrauds.length,
                    totalAmountFlagged: `₹${(totalAmount / 10000000).toFixed(2)} Cr`,
                    amountRecovered: `₹${(recoveredAmount / 10000000).toFixed(2)} Cr`,
                    detectionRate: `${((verifiedFrauds.length / alerts.length) * 100).toFixed(1)}%`
                },
                topOffenders,
                riskDistribution: {
                    critical: alerts.filter(a => a.riskScore >= 80).length,
                    high: alerts.filter(a => a.riskScore >= 60 && a.riskScore < 80).length,
                    medium: alerts.filter(a => a.riskScore >= 40 && a.riskScore < 60).length,
                    low: alerts.filter(a => a.riskScore < 40).length
                }
            };

            res.json(report);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
