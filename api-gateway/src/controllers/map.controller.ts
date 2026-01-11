import { Request, Response } from 'express';
import { Vendor, Alert } from '../models';

export class MapController {
    /**
     * Get all geospatial data for map visualization
     * Returns vendors and alerts with coordinates
     */
    static async getMapData(req: Request, res: Response) {
        try {
            // Fetch all vendors with coordinates
            const vendors = await Vendor.find({
                latitude: { $exists: true, $ne: null },
                longitude: { $exists: true, $ne: null }
            }).select('id name gstin address latitude longitude riskScore accountStatus operatingSchemes');

            // Fetch all alerts with coordinates
            const alerts = await Alert.find({
                $or: [
                    { latitude: { $exists: true, $ne: null } },
                    { coordinates: { $exists: true, $ne: null } }
                ]
            }).select('id scheme vendor amount riskScore riskLevel status timestamp district latitude longitude coordinates mlReasons');

            // Process alerts to ensure consistent coordinate format
            const processedAlerts = alerts.map(alert => {
                const alertObj = alert.toObject();

                // Handle both coordinate formats
                if (alertObj.coordinates && Array.isArray(alertObj.coordinates) && alertObj.coordinates.length === 2) {
                    alertObj.latitude = alertObj.coordinates[0];
                    alertObj.longitude = alertObj.coordinates[1];
                } else if (!alertObj.latitude && alertObj.coordinates) {
                    // Fallback if coordinates exist but not in expected format
                    alertObj.latitude = alertObj.coordinates[0] || 28.6139;
                    alertObj.longitude = alertObj.coordinates[1] || 77.2090;
                }

                return alertObj;
            });

            // Create heatmap data points (for payment zones)
            const heatmapPoints = processedAlerts.map(alert => ({
                lat: alert.latitude,
                lng: alert.longitude,
                intensity: alert.amount / 100000, // Normalize amount for heat intensity
                riskScore: alert.riskScore
            }));

            return res.json({
                vendors: vendors.map(v => v.toObject()),
                alerts: processedAlerts,
                heatmapPoints,
                metadata: {
                    totalVendors: vendors.length,
                    totalAlerts: alerts.length,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error: any) {
            console.error('Get map data failed:', error);
            return res.status(500).json({
                error: 'Failed to fetch map data',
                message: error.message
            });
        }
    }

    /**
     * Get vendors only (for vendor layer)
     */
    static async getVendors(req: Request, res: Response) {
        try {
            const vendors = await Vendor.find({
                latitude: { $exists: true, $ne: null },
                longitude: { $exists: true, $ne: null }
            });

            return res.json(vendors);
        } catch (error: any) {
            console.error('Get vendors for map failed:', error);
            return res.status(500).json({ error: 'Failed to fetch vendors' });
        }
    }
}
