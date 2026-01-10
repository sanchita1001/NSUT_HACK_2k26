import { Request, Response } from 'express';
import { Alert, AuditLog } from '../models'; // Assumes models/index.ts exports these
import { MLService } from '../services/ml.service';
import { NotificationService } from '../services/notification.service';
import { Kafka } from 'kafkajs';

// Kafka Setup (Simplistic for now, ideally moved to a separate service)
const kafka = new Kafka({
    clientId: 'api-gateway',
    brokers: ['localhost:9092'],
    retry: { retries: 2 }
});
const producer = kafka.producer();
let isKafkaConnected = false;
(async () => {
    try {
        await producer.connect();
        isKafkaConnected = true;
        console.log("✅ Kafka Producer Connected");
    } catch (e) { console.warn("⚠️ Kafka Connection Failed"); }
})();

export class AlertController {

    static async createAlert(req: Request, res: Response) {
        try {
            const { amount, scheme, vendor, beneficiary, description, district } = req.body;

            // ===== FEATURE 1: INPUT VALIDATION =====
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Amount must be positive' });
            }
            if (!scheme) {
                return res.status(400).json({ error: 'Scheme is required' });
            }
            if (!vendor) {
                return res.status(400).json({ error: 'Vendor is required' });
            }

            // 1. Get Risk Score from ML Service
            const mlResult = await MLService.predictFraud({
                amount: Number(amount),
                agency: scheme || "Unknown",
                vendor: vendor || "Unknown"
            });

            // ===== FEATURE 3: VENDOR HISTORY TRACKING =====
            const vendorAlerts = await Alert.find({ vendor: vendor });
            const avgVendorRisk = vendorAlerts.length > 0
                ? vendorAlerts.reduce((sum, a) => sum + a.riskScore, 0) / vendorAlerts.length
                : 0;

            if (avgVendorRisk > 60 && vendorAlerts.length >= 3) {
                mlResult.riskScore += 20;
                mlResult.mlReasons.push(`Vendor has high average risk score (${avgVendorRisk.toFixed(0)})`);
            }

            // ===== FEATURE 4: TRANSACTION FREQUENCY DETECTION =====
            const recentCount = await Alert.countDocuments({
                vendor: vendor,
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
            });

            if (recentCount >= 5) {
                mlResult.riskScore += 25;
                mlResult.mlReasons.push(`High transaction frequency: ${recentCount} transactions in 24 hours`);
            }

            // ===== FEATURE 6: DUPLICATE TRANSACTION DETECTION =====
            const duplicate = await Alert.findOne({
                amount: Number(amount),
                vendor: vendor,
                scheme: scheme,
                timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000).toISOString() } // Last hour
            });

            if (duplicate) {
                mlResult.riskScore += 40;
                mlResult.mlReasons.push(`Duplicate transaction detected (similar to ${duplicate.id})`);
            }

            // Cap risk score at 99
            mlResult.riskScore = Math.min(99, mlResult.riskScore);

            // ===== FEATURE 2: PROPER RISK LEVEL CLASSIFICATION =====
            const getRiskLevel = (score: number): string => {
                if (score >= 80) return 'Critical';
                if (score >= 60) return 'High';
                if (score >= 40) return 'Medium';
                return 'Low';
            };
            const riskLevel = getRiskLevel(mlResult.riskScore);

            // Map districts to real coordinates (India)
            const districtCoords: Record<string, { lat: number, lng: number }> = {
                "Lucknow": { lat: 26.8467, lng: 80.9462 },
                "Patna": { lat: 25.5941, lng: 85.1376 },
                "Mumbai": { lat: 19.0760, lng: 72.8777 },
                "New Delhi": { lat: 28.6139, lng: 77.2090 }
            };

            // Use provided district or default
            const alertDistrict = district || ["Lucknow", "Patna", "Mumbai", "New Delhi"][Math.floor(Math.random() * 4)];
            const coords = districtCoords[alertDistrict] || { lat: 20.5937, lng: 78.9629 }; // India center

            // 3. Create Alert Record
            const newAlert = await Alert.create({
                id: `ALT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString(),
                status: "New",
                riskLevel,
                riskScore: mlResult.riskScore,
                mlReasons: mlResult.mlReasons,
                amount: Number(amount),
                scheme: scheme || "Unknown",
                vendor: vendor || "Unknown",
                beneficiary: beneficiary || "Unknown",
                account: "XX-" + Math.floor(1000 + Math.random() * 9000),
                district: alertDistrict,
                latitude: coords.lat,
                longitude: coords.lng,
                hierarchy: []
            });

            // 4. Kafka Event (Fire and Forget)
            if (isKafkaConnected) {
                producer.send({
                    topic: 'suspicious_transactions',
                    messages: [{
                        value: JSON.stringify({
                            eventId: `EVT-${Date.now()}`,
                            type: 'RISK_SCORED',
                            alertId: newAlert.id,
                            riskScore: mlResult.riskScore,
                            riskLevel: riskLevel
                        })
                    }]
                }).catch(e => console.error("Kafka Publish Error:", e));
            }

            // 5. Audit Log
            await AuditLog.create({
                id: `LOG-${Date.now()}`,
                action: "PAYMENT_PROCESSED",
                actor: "User",
                target: newAlert.id,
                details: `Processed payment of ₹${amount}. Risk: ${riskLevel} (${mlResult.riskScore})`
            });

            // ===== FEATURE 12: EMAIL NOTIFICATIONS =====
            // Send email for critical alerts (async, non-blocking)
            if (mlResult.riskScore >= 90) {
                NotificationService.sendCriticalAlertEmail(newAlert.toObject()).catch(err =>
                    console.error('Email notification failed:', err)
                );
            }

            // Return Alert + ML Analysis Flag
            return res.json({
                ...newAlert.toObject(),
                isAnomaly: mlResult.isAnomaly || mlResult.riskScore >= 70
            });

        } catch (error: any) {
            console.error("Create Alert Error:", error);
            return res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }

    static async getStats(req: Request, res: Response) {
        try {
            const totalAlerts = await Alert.countDocuments();
            const recentAlerts = await Alert.countDocuments({
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
            });

            // Calculate total flagged volume
            const allAlerts = await Alert.find();
            const totalVolume = allAlerts.reduce((sum, alert) => sum + alert.amount, 0);

            // Get recent high risk alerts
            const recentHighRisk = await Alert.find({ riskScore: { $gt: 75 } })
                .sort({ timestamp: -1 })
                .limit(5);

            // Get recent transactions (ALL)
            const recentTransactions = await Alert.find()
                .sort({ timestamp: -1 })
                .limit(5);

            res.json({
                totalAlerts,
                recentAlerts,
                totalVolume: `₹${(totalVolume / 10000000).toFixed(2)} Cr`,
                recentHighRisk,
                recentTransactions
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAlerts(req: Request, res: Response) {
        try {
            const alerts = await Alert.find().sort({ timestamp: -1 });
            return res.json(alerts);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch alerts" });
        }
    }

    static async updateAlertStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const alert = await Alert.findOneAndUpdate(
                { id },
                { status, $push: { hierarchy: { role: 'Officer', name: 'User', status, time: new Date().toISOString() } } },
                { new: true }
            );

            if (!alert) {
                return res.status(404).json({ error: "Alert not found" });
            }

            // Log the action
            await AuditLog.create({
                id: `LOG-${Date.now()}`,
                action: "STATUS_UPDATE",
                actor: "User",
                target: id,
                details: `Updated status to ${status}. Notes: ${notes || 'None'}`
            });

            return res.json(alert);
        } catch (error) {
            return res.status(500).json({ error: "Failed to update alert status" });
        }
    }
}
