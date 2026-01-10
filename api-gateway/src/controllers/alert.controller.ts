import { Request, Response } from 'express';
import { Alert, AuditLog } from '../models'; // Assumes models/index.ts exports these
import { MLService } from '../services/ml.service';
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
            const { amount, scheme, vendor, beneficiary, description } = req.body;

            // 1. Get Risk Score from ML Service
            const mlResult = await MLService.predictFraud({
                amount: Number(amount),
                agency: scheme || "Unknown",
                vendor: vendor || "Unknown"
            });

            // 2. Risk Evaluation
            // 2. Risk Evaluation (Manual classification removed as per request)
            const riskLevel = mlResult.riskScore.toString();

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
                district: ["Lucknow", "Patna", "Mumbai", "New Delhi"][Math.floor(Math.random() * 4)],
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
                            riskScore: mlResult.riskScore
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
                details: `Processed payment of ${amount}. Risk Score: ${mlResult.riskScore}`
            });

            // Return Alert + ML Analysis Flag (isAnomaly) so frontend doesn't need hardcoded thresholds
            return res.json({
                ...newAlert.toObject(),
                isAnomaly: mlResult.isAnomaly
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
}
