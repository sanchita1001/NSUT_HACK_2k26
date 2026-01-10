import { Request, Response } from 'express';
import { Alert } from '../models';
import { MLService } from '../services/ml.service';

export class SummaryController {
    /**
     * Get all flagged transactions (high risk alerts)
     */
    static async getFlaggedTransactions(req: Request, res: Response) {
        try {
            // Fetch alerts with risk score >= 70 (flagged as anomalies)
            const flaggedAlerts = await Alert.find({
                riskScore: { $gte: 70 }
            })
                .sort({ timestamp: -1 })
                .limit(100)
                .lean();

            res.json({
                success: true,
                count: flaggedAlerts.length,
                data: flaggedAlerts
            });
        } catch (error: any) {
            console.error('[Summary Controller] Error fetching flagged transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch flagged transactions',
                error: error.message
            });
        }
    }

    /**
     * Generate AI-powered vendor/agency profile for a specific alert using Ollama
     * Queries vendor-specific historical data from predictions_store.jsonl via ML service
     */
    static async generateProfile(req: Request, res: Response) {
        try {
            const { alertId } = req.params;

            // Fetch the alert from database
            const alert = await Alert.findOne({ id: alertId }).lean();

            if (!alert) {
                return res.status(404).json({
                    success: false,
                    message: 'Alert not found'
                });
            }

            // Get vendor from alert (fallback to scheme if vendor not available)
            const vendor = (alert as any).vendor || alert.scheme;

            // Query vendor historical data from ML service (reads from predictions_store.jsonl)
            let vendorContext;
            try {
                const vendorHistoryResponse = await MLService.getVendorHistory(vendor);
                vendorContext = vendorHistoryResponse.data;
            } catch (error) {
                console.warn('[Summary Controller] Failed to fetch vendor history from JSONL, using empty context');
                vendorContext = {
                    totalTransactions: 0,
                    averageAmount: 0,
                    totalVolume: 0,
                    highRiskCount: 0,
                    averageRiskScore: 0,
                    recentTransactions: []
                };
            }

            // Call ML service to generate profile using Ollama with vendor context from JSONL
            const profileData = await MLService.generateVendorProfile({
                amount: alert.amount,
                agency: (alert as any).agency || alert.scheme,
                vendor: vendor,
                transaction_time: (alert as any).transactionTime
            }, vendorContext);

            res.json({
                success: true,
                alert: {
                    id: alert.id,
                    amount: alert.amount,
                    agency: (alert as any).agency || alert.scheme,
                    vendor: vendor,
                    riskScore: alert.riskScore,
                    timestamp: alert.timestamp
                },
                vendorContext: profileData.vendor_context || vendorContext,
                profile: profileData.vendor_profile,
                fraudScore: profileData.fraud_score,
                riskScore: profileData.risk_score,
                reasons: profileData.reasons
            });
        } catch (error: any) {
            console.error('[Summary Controller] Error generating profile:', error);

            // Return more specific error message
            const errorMessage = error.message || 'Failed to generate profile';
            res.status(500).json({
                success: false,
                message: errorMessage,
                error: errorMessage
            });
        }
    }
}
