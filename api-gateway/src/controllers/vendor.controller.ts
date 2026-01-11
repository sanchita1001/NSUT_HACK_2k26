import { Request, Response } from 'express';
import { Vendor, Alert } from '../models';

export class VendorController {
    // ===== FEATURE 8: VENDOR RISK PROFILING =====
    static async getVendorRiskProfile(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const vendor = await Vendor.findOne({ id });
            if (!vendor) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            // Get all alerts for this vendor
            const alerts = await Alert.find({ vendor: vendor.name });

            const totalTransactions = alerts.length;
            const totalVolume = alerts.reduce((sum, a) => sum + (a.amount || 0), 0);
            const averageRiskScore = totalTransactions > 0
                ? alerts.reduce((sum, a) => sum + (a.riskScore || 0), 0) / totalTransactions
                : 0;
            const flaggedTransactions = alerts.filter(a => (a.riskScore || 0) > 70).length;

            // Calculate risk trend (last 10 vs previous 10)
            const sortedAlerts = alerts.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            const recent10 = sortedAlerts.slice(0, 10);
            const previous10 = sortedAlerts.slice(10, 20);

            const recentAvg = recent10.length > 0
                ? recent10.reduce((sum, a) => sum + a.riskScore, 0) / recent10.length
                : 0;
            const previousAvg = previous10.length > 0
                ? previous10.reduce((sum, a) => sum + a.riskScore, 0) / previous10.length
                : 0;

            let riskTrend = 'stable';
            if (recentAvg > previousAvg + 10) riskTrend = 'increasing';
            if (recentAvg < previousAvg - 10) riskTrend = 'decreasing';

            // Detect suspicious patterns
            const suspiciousPatterns = [];

            // Pattern 1: Multiple round numbers
            const roundNumbers = alerts.filter(a => a.amount > 10000 && a.amount % 1000 === 0);
            if (roundNumbers.length > 3) {
                suspiciousPatterns.push(`${roundNumbers.length} round-number transactions detected`);
            }

            // Pattern 2: High frequency
            const last24h = alerts.filter(a =>
                new Date(a.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
            );
            if (last24h.length >= 5) {
                suspiciousPatterns.push(`High transaction frequency: ${last24h.length} in 24 hours`);
            }

            // Pattern 3: Consistent high risk
            if (averageRiskScore > 60) {
                suspiciousPatterns.push(`Consistently high risk score (avg: ${averageRiskScore.toFixed(0)})`);
            }

            res.json({
                vendorId: id,
                vendorName: vendor.name,
                totalTransactions,
                totalVolume: `₹${(totalVolume / 100000).toFixed(2)} L`,
                averageRiskScore: averageRiskScore.toFixed(1),
                flaggedTransactions,
                riskTrend,
                suspiciousPatterns,
                recentAlerts: recent10.slice(0, 5).map(a => ({
                    id: a.id,
                    amount: a.amount,
                    riskScore: a.riskScore,
                    date: a.date
                }))
            });
        } catch (error: any) {
            console.error('Vendor risk profile error:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch risk profile' });
        }
    }

    static async createVendor(req: Request, res: Response) {
        try {
            const {
                id, name, gstin, address, riskScore, status, latitude, longitude, selectedScheme,
                paymentBehavior, timingToleranceDays
            } = req.body;

            const vendor = await Vendor.create({
                id,
                name,
                gstin,
                address,
                riskScore: riskScore || 0,
                accountStatus: status || 'ACTIVE',
                latitude,
                longitude,
                operatingSchemes: selectedScheme ? [selectedScheme] : [],
                paymentBehavior: paymentBehavior || 'REGULAR',
                timingToleranceDays: timingToleranceDays ? Number(timingToleranceDays) : 0
            });

            res.status(201).json(vendor);
        } catch (error: any) {
            console.error('Create vendor error:', error);
            res.status(500).json({ error: error.message || 'Failed to create vendor' });
        }
    }

    static async updateVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Find original vendor first to check for name change
            const originalVendor = await Vendor.findOne({ id });
            if (!originalVendor) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            // Perform Update
            const vendor = await Vendor.findOneAndUpdate(
                { id },
                updates,
                { new: true, runValidators: true }
            );

            // Check if name changed and propagate to Alerts
            if (updates.name && originalVendor.name !== updates.name) {
                const { Alert } = require('../models');
                const updateResult = await Alert.updateMany(
                    { vendor: originalVendor.name },
                    { $set: { vendor: updates.name } }
                );
                console.log(`Propagated vendor name change: ${originalVendor.name} -> ${updates.name} (${updateResult.modifiedCount} alerts updated)`);
            }

            res.json(vendor);
        } catch (error: any) {
            console.error('Update vendor error:', error);
            res.status(500).json({ error: error.message || 'Failed to update vendor' });
        }
    }

    static async deleteVendor(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { confirm } = req.query; // Optional confirmation flag

            const vendor = await Vendor.findOne({ id });
            if (!vendor) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            // Check for dependencies in Alert collection
            const alertCount = await Alert.countDocuments({ vendor: vendor.name });

            if (alertCount > 0 && !confirm) {
                // Return impact analysis without deleting
                return res.status(409).json({
                    error: 'Vendor has existing references',
                    message: `This vendor is referenced by ${alertCount} alert(s). Add ?confirm=true to proceed with deletion.`,
                    impact: {
                        alerts: alertCount,
                        vendorName: vendor.name
                    },
                    requiresConfirmation: true
                });
            }

            // Delete vendor (alerts will keep vendor name as historical data)
            await Vendor.findOneAndDelete({ id });

            res.json({
                message: 'Vendor deleted successfully',
                id,
                note: alertCount > 0 ? `${alertCount} alert(s) still reference this vendor name for historical purposes` : undefined
            });
        } catch (error: any) {
            console.error('Delete vendor error:', error);
            res.status(500).json({ error: error.message || 'Failed to delete vendor' });
        }
    }
}
