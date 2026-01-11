import { Request, Response } from 'express';
import { Alert, AuditLog, Vendor } from '../models';
import { MLService } from '../services/ml.service';
import { NotificationService } from '../services/notification.service';
import { AuditLogService, AuditEventType } from '../services/audit.service';
import { Kafka } from 'kafkajs';

// Kafka Setup
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

    /**
     * Get detailed alert information by ID
     * Complete investigation view with all related data
     */
    static async getAlertById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            // Find the alert
            const alert = await Alert.findOne({ id });

            if (!alert) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            // Get audit logs for this alert (timeline)
            const auditLogs = await AuditLog.find({
                target: new RegExp(`Alert:${id}`, 'i')
            }).sort({ timestamp: -1 }).limit(50);

            // Get related alerts (same vendor or scheme)
            const relatedAlerts = await Alert.find({
                $or: [
                    { vendor: alert.vendor },
                    { scheme: alert.scheme }
                ],
                id: { $ne: id } // Exclude current alert
            }).limit(10).sort({ timestamp: -1 });

            // Get vendor history statistics via Aggregation for accuracy and performance
            const statsAggregation = await Alert.aggregate([
                {
                    $match: {
                        vendor: alert.vendor,
                        amount: { $lt: 1e15 } // Filter out unrealistic test data outliers
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAlerts: { $sum: 1 },
                        averageRiskScore: { $avg: "$riskScore" },
                        highRiskCount: {
                            $sum: { $cond: [{ $gt: ["$riskScore", 70] }, 1, 0] }
                        },
                        totalVolume: { $sum: "$amount" }
                    }
                }
            ]);

            const aggregatedStats = statsAggregation[0] || {
                totalAlerts: 0,
                averageRiskScore: 0,
                highRiskCount: 0,
                totalVolume: 0
            };

            const stats = {
                context: 'Vendor',
                totalAlerts: aggregatedStats.totalAlerts,
                averageRiskScore: aggregatedStats.averageRiskScore || 0,
                highRiskCount: aggregatedStats.highRiskCount,
                totalVolume: aggregatedStats.totalVolume,
            };

            // Get historical alerts for timeline/frequency (limit to recent/relevant if needed, but keeping existing logic)
            const historicalAlerts = await Alert.find({
                vendor: alert.vendor
            }).sort({ timestamp: -1 });

            // Calculate risk score breakdown
            const riskBreakdown = {
                baseScore: alert.riskScore,
                mlScore: alert.riskScore,
                vendorHistory: stats.averageRiskScore > 60 ? 20 : 0,
                amountAnomaly: alert.amount > 1000000 ? 15 : 0,
                frequencyAnomaly: historicalAlerts.filter(a => {
                    const alertTime = new Date(a.timestamp).getTime();
                    const currentTime = new Date(alert.timestamp).getTime();
                    return Math.abs(alertTime - currentTime) < 24 * 60 * 60 * 1000;
                }).length > 5 ? 25 : 0,
            };

            // Log the view action
            await AuditLogService.logAlert(
                AuditEventType.ALERT_VIEWED,
                alert,
                user || { id: 'anonymous', name: 'Anonymous', role: 'viewer' },
                undefined,
                undefined,
                { viewedAt: new Date().toISOString() }
            );

            // Return comprehensive alert data
            return res.json({
                alert: alert.toObject(),
                timeline: auditLogs.map(log => ({
                    id: log.id,
                    timestamp: log.timestamp,
                    eventType: log.eventType,
                    actor: log.actor,
                    action: log.action,
                    details: log.details,
                })),
                relatedAlerts: relatedAlerts.map(a => ({
                    id: a.id,
                    riskScore: a.riskScore,
                    amount: a.amount,
                    status: a.status,
                    timestamp: a.timestamp,
                })),
                vendorStats: stats,
                riskBreakdown,
                metadata: {
                    viewedAt: new Date().toISOString(),
                    viewedBy: user?.name || 'Anonymous',
                }
            });

        } catch (error) {
            console.error('Get alert by ID failed:', error);
            return res.status(500).json({ error: 'Failed to fetch alert details' });
        }
    }

    static async createAlert(req: Request, res: Response) {
        try {
            const { amount, scheme, vendor, beneficiary, description, district, transactionId } = req.body;
            const user = (req as any).user;

            // Input validation
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Amount must be positive' });
            }
            if (!scheme) {
                return res.status(400).json({ error: 'Scheme is required' });
            }
            if (!vendor) {
                return res.status(400).json({ error: 'Vendor is required' });
            }

            // Fix #6: Idempotency check
            if (transactionId) {
                const existingAlert = await Alert.findOne({ transactionId });
                if (existingAlert) {
                    return res.status(200).json(existingAlert); // Return existing alert
                }
            }

            // Fix #4 & #5: Require vendor registration and use proper lookup
            // Try ID first, fallback to name for backward compatibility
            const vendorProfile = await Vendor.findOne({
                $or: [{ id: vendor }, { name: vendor }]
            });

            if (!vendorProfile) {
                return res.status(400).json({
                    error: 'Vendor not registered. Please register vendor before creating transactions.'
                });
            }

            // Fix #21: Load vendor history once (performance optimization)
            const [lastAlert, vendorAlerts, schemeData] = await Promise.all([
                Alert.findOne({ vendor: vendor }).sort({ timestamp: -1 }),
                Alert.find({ vendor: vendor }), // Fix #14: Load before creating new alert
                require('../models').Scheme.findOne({ name: scheme })
            ]);

            let paymentBehavior = vendorProfile.paymentBehavior || "REGULAR";
            let daysSinceLast = 999;
            let lastPaymentDate: Date | undefined;

            if (lastAlert) {
                lastPaymentDate = new Date(lastAlert.timestamp);
                const diffTime = Math.abs(Date.now() - lastPaymentDate.getTime());
                daysSinceLast = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            // PAYMENT BEHAVIOR VALIDATION
            const { PaymentBehaviorValidator } = require('../services/payment-behavior.service');
            const behaviorValidation = PaymentBehaviorValidator.validatePayment(
                vendorProfile,
                Number(amount),
                lastPaymentDate
            );

            // Get ML risk score
            const mlResult = await MLService.predictFraud({
                amount: Number(amount),
                agency: scheme || "Unknown",
                vendor: vendor || "Unknown",
                paymentBehavior,
                daysSinceLastPayment: daysSinceLast
            });

            // Add payment behavior violations to ML reasons
            if (behaviorValidation.violations.length > 0) {
                mlResult.mlReasons.push(...behaviorValidation.violations);
                mlResult.riskScore = Math.min(mlResult.riskScore + behaviorValidation.riskIncrease, 100); // Fix #1: Cap at 100
            }

            // Fix #17: Benford's Law check
            const { BenfordService } = require('../services/benford.service');
            const benfordCheck = BenfordService.checkAmount(Number(amount));
            if (benfordCheck.violation) {
                mlResult.riskScore = Math.min(mlResult.riskScore + benfordCheck.riskIncrease, 100);
                if (benfordCheck.reason) {
                    mlResult.mlReasons.push(benfordCheck.reason);
                }
            }

            // Fix #14: Vendor history tracking (calculated before creating alert)
            const avgVendorRisk = vendorAlerts.length > 0
                ? vendorAlerts.reduce((sum, a) => sum + a.riskScore, 0) / vendorAlerts.length
                : 0;

            if (avgVendorRisk > 60 && vendorAlerts.length >= 3) {
                mlResult.riskScore = Math.min(mlResult.riskScore + 20, 100); // Fix #1: Cap
                mlResult.mlReasons.push(`Vendor has high average risk score: ${avgVendorRisk.toFixed(1)}`);
            }

            // Transaction frequency detection
            const recentCount = await Alert.countDocuments({
                vendor: vendor,
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            if (recentCount >= 5) {
                mlResult.riskScore = Math.min(mlResult.riskScore + 25, 100); // Fix #1: Cap
                mlResult.mlReasons.push(`High transaction frequency: ${recentCount} in 24 hours`);
            }

            // Fix #2 & #3: Improved duplicate detection (24 hours + amount range)
            const duplicate = await Alert.findOne({
                amount: {
                    $gte: Number(amount) * 0.95,  // Within 5%
                    $lte: Number(amount) * 1.05
                },
                vendor: vendor,
                scheme: scheme,
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours instead of 1 hour
            });

            if (duplicate) {
                mlResult.riskScore = Math.min(mlResult.riskScore + 40, 100); // Fix #1: Cap
                mlResult.mlReasons.push(`Duplicate transaction detected (similar to ${duplicate.id})`);
            }

            // Fix #18: Scheme budget validation
            if (schemeData && schemeData.budgetAllocated) {
                const totalSpent = await Alert.aggregate([
                    { $match: { scheme: scheme } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);

                const currentSpending = (totalSpent[0]?.total || 0) + Number(amount);
                if (currentSpending > schemeData.budgetAllocated) {
                    mlResult.riskScore = Math.min(mlResult.riskScore + 50, 100); // Fix #1: Cap
                    mlResult.mlReasons.push(
                        `Scheme budget exceeded: ₹${currentSpending.toLocaleString()} > ₹${schemeData.budgetAllocated.toLocaleString()}`
                    );
                }
            }

            // Fix #19: Beneficiary validation
            if (beneficiary) {
                const beneficiaryPayments = await Alert.countDocuments({
                    beneficiary: beneficiary,
                    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                });

                if (beneficiaryPayments >= 5) {
                    mlResult.riskScore = Math.min(mlResult.riskScore + 20, 100); // Fix #1: Cap
                    mlResult.mlReasons.push(`Beneficiary received ${beneficiaryPayments} payments in last 30 days`);
                }
            }

            // Fix #20: Time-of-day analysis
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();

            if (hour < 6 || hour > 22) {
                mlResult.riskScore = Math.min(mlResult.riskScore + 15, 100); // Fix #1: Cap
                mlResult.mlReasons.push(`Transaction outside business hours (${hour}:00)`);
            }

            if (day === 0 || day === 6) {
                mlResult.riskScore = Math.min(mlResult.riskScore + 10, 100); // Fix #1: Cap
                mlResult.mlReasons.push('Weekend transaction');
            }

            // Fix #1: Final risk score cap
            mlResult.riskScore = Math.min(mlResult.riskScore, 100);

            // Risk level classification
            const getRiskLevel = (score: number): string => {
                if (score >= 80) return 'Critical';
                if (score >= 60) return 'High';
                if (score >= 40) return 'Medium';
                return 'Low';
            };

            const riskLevel = getRiskLevel(mlResult.riskScore);

            // District assignment and coordinate fetching
            const districtCoords: { [key: string]: [number, number] } = {
                "North Delhi": [28.7041, 77.1025],
                "South Delhi": [28.5355, 77.2500],
                "East Delhi": [28.6692, 77.3150],
                "West Delhi": [28.6517, 77.1389],
                "Central Delhi": [28.6448, 77.2167],
            };

            let assignedDistrict = district || "Central Delhi";
            let coords: [number, number] = [28.6139, 77.2090];

            if (vendorProfile && vendorProfile.latitude && vendorProfile.longitude) {
                coords = [vendorProfile.latitude, vendorProfile.longitude];
                assignedDistrict = vendorProfile.address || assignedDistrict;
            } else if (district && districtCoords[district]) {
                coords = districtCoords[district];
                assignedDistrict = district;
            } else if (!district) {
                assignedDistrict = Object.keys(districtCoords)[Math.floor(Math.random() * 5)];
                coords = districtCoords[assignedDistrict];
            }

            // Create alert (Fix #11: timestamp is now Date type)
            const newAlert = await Alert.create({
                id: `ALERT-${Date.now()}`,
                transactionId: transactionId || undefined, // Fix #6
                scheme,
                vendor,
                vendorId: vendorProfile.id, // Fix #5
                beneficiary: beneficiary || "Unknown",
                amount: Number(amount),
                riskScore: mlResult.riskScore,
                riskLevel,
                status: "New",
                timestamp: new Date(), // Fix #11: Date type instead of string
                mlReasons: mlResult.mlReasons,
                district: assignedDistrict,
                latitude: coords[0],
                longitude: coords[1],
                coordinates: coords,
                description: description || `Potential fraud detected in ${scheme}`
            });

            // Fix #13: Update vendor risk score and statistics
            await Vendor.updateOne(
                { id: vendorProfile.id },
                {
                    $set: { riskScore: Math.round(avgVendorRisk) },
                    $inc: {
                        totalVolume: Number(amount),
                        flaggedTransactions: mlResult.riskScore > 70 ? 1 : 0
                    }
                }
            );

            // Kafka notification
            if (isKafkaConnected) {
                try {
                    await producer.send({
                        topic: 'fraud-alerts',
                        messages: [{
                            value: JSON.stringify({
                                alertId: newAlert.id,
                                riskScore: mlResult.riskScore,
                                riskLevel,
                                amount,
                                vendor,
                                timestamp: new Date().toISOString()
                            })
                        }]
                    });
                } catch (kafkaErr) {
                    console.warn("Kafka send failed:", kafkaErr);
                }
            }

            // Audit log
            await AuditLogService.logAlert(
                AuditEventType.ALERT_CREATED,
                newAlert,
                user || { id: 'system', name: 'System', role: 'system' },
                undefined,
                newAlert.toObject(),
                {
                    mlRiskScore: mlResult.riskScore,
                    detectionReasons: mlResult.mlReasons,
                }
            );

            // Email notification for critical alerts
            if (mlResult.riskScore >= 90) {
                NotificationService.sendCriticalAlertEmail(newAlert.toObject()).catch(err =>
                    console.error('Email notification failed:', err)
                );
            }

            return res.json({
                ...newAlert.toObject(),
                isAnomaly: mlResult.isAnomaly || mlResult.riskScore >= 70
            });

        } catch (error) {
            console.error('Create alert failed:', error);
            return res.status(500).json({ error: 'Failed to create alert' });
        }
    }

    static async updateAlertStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const user = (req as any).user;

            const validStatuses = ['New', 'Investigating', 'Verified', 'Dismissed', 'Closed'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const alert = await Alert.findOne({ id });
            if (!alert) {
                return res.status(404).json({ error: 'Alert not found' });
            }

            const beforeState = { status: alert.status };
            alert.status = status;
            await alert.save();
            const afterState = { status: alert.status };

            // Audit log with state tracking
            await AuditLogService.logAlert(
                AuditEventType.ALERT_STATUS_CHANGED,
                alert,
                user || { id: 'system', name: 'System', role: 'system' },
                beforeState,
                afterState,
                { changedAt: new Date().toISOString() }
            );

            return res.json({ message: 'Status updated', alert: alert.toObject() });

        } catch (error) {
            console.error('Update alert status failed:', error);
            return res.status(500).json({ error: 'Failed to update status' });
        }
    }

    static async getAlerts(req: Request, res: Response) {
        try {
            const alerts = await Alert.find().sort({ timestamp: -1 }).limit(100);
            return res.json(alerts);
        } catch (error) {
            console.error('Get alerts failed:', error);
            return res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    }

    static async getStats(req: Request, res: Response) {
        try {
            const totalAlerts = await Alert.countDocuments();
            const recentAlerts = await Alert.countDocuments({
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
            });

            const alerts = await Alert.find().sort({ timestamp: -1 }).limit(10);
            const totalVolume = await Alert.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            return res.json({
                totalAlerts,
                recentAlerts,
                totalVolume: totalVolume[0]?.total ? `₹${totalVolume[0].total.toLocaleString()}` : '₹0',
                recentTransactions: alerts
            });
        } catch (error) {
            console.error('Get stats failed:', error);
            return res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }
}
