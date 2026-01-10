import { Request, Response } from 'express';
import { Vendor, Alert } from '../models';

export class NetworkController {
    static async getVendorNetwork(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Find the target vendor
            const targetVendor = await Vendor.findOne({ id });
            if (!targetVendor) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            // fetch all alerts to analyze relationships
            // In a real large-scale system, this would be an aggregation pipeline
            const alerts = await Alert.find().lean();

            // 1. Identify Schemes the target vendor is involved in
            const targetVendorAlerts = alerts.filter(a => a.vendor === targetVendor.name);
            const targetSchemes = new Set(targetVendorAlerts.map(a => a.scheme));

            // 2. Find other vendors in the same schemes (Collusion Risk)
            const relatedVendorsMap = new Map<string, Set<string>>(); // VendorName -> Set of Shared Schemes

            alerts.forEach(alert => {
                const alertVendor = alert.vendor;
                if (alertVendor !== targetVendor.name && targetSchemes.has(alert.scheme)) {
                    if (!relatedVendorsMap.has(alertVendor)) {
                        relatedVendorsMap.set(alertVendor, new Set());
                    }
                    relatedVendorsMap.get(alertVendor)?.add(alert.scheme);
                }
            });

            // 3. Fetch details for related vendors
            const relatedVendorNames = Array.from(relatedVendorsMap.keys());
            const relatedVendors = await Vendor.find({ name: { $in: relatedVendorNames } }).lean();

            // Build Graph
            const nodes: any[] = [];
            const edges: any[] = [];

            // Central Node (Target Vendor)
            nodes.push({
                id: targetVendor.id,
                data: {
                    label: targetVendor.name,
                    riskScore: targetVendor.riskScore,
                    volume: targetVendor.totalVolume
                },
                position: { x: 0, y: 0 }, // Position handled by frontend layout
                style: {
                    background: '#ef4444',
                    color: 'white',
                    border: '2px solid #991b1b',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    width: 150,
                    textAlign: 'center'
                },
                type: 'input' // Center node
            });

            // Related Nodes
            let angle = 0;
            const radius = 250;
            const step = (2 * Math.PI) / (relatedVendors.length || 1);

            relatedVendors.forEach((vendor) => {
                const sharedSchemes = relatedVendorsMap.get(vendor.name) || new Set();
                const sharedCount = sharedSchemes.size;

                // Risk-based styling
                const isHighRisk = vendor.riskScore > 70;
                const nodeColor = isHighRisk ? '#f97316' : '#3b82f6';
                const borderColor = isHighRisk ? '#c2410c' : '#1d4ed8';

                // Calculate position in circle
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                angle += step;

                nodes.push({
                    id: vendor.id,
                    data: {
                        label: vendor.name,
                        riskScore: vendor.riskScore,
                        sharedSchemes: Array.from(sharedSchemes).join(', ')
                    },
                    position: { x, y },
                    style: {
                        background: nodeColor,
                        color: 'white',
                        border: `1px solid ${borderColor}`,
                        borderRadius: '6px',
                        padding: '8px',
                        fontSize: '12px',
                        width: 120,
                        textAlign: 'center'
                    }
                });

                // Edge: Target -> Related Vendor
                edges.push({
                    id: `e-${targetVendor.id}-${vendor.id}`,
                    source: targetVendor.id,
                    target: vendor.id,
                    label: `${sharedCount} Shared Scheme${sharedCount > 1 ? 's' : ''}`,
                    type: 'straight',
                    animated: isHighRisk, // Animate high risk connections
                    style: {
                        stroke: isHighRisk ? '#f97316' : '#94a3b8',
                        strokeWidth: Math.min(sharedCount, 5) // Thicker lines for more shared schemes
                    }
                });
            });

            // If no relationships found, return just the central node with a note
            if (nodes.length === 1) {
                // Determine layout for single node (optional)
            }

            res.json({
                nodes,
                edges,
                meta: {
                    target: targetVendor.name,
                    relatedCount: relatedVendors.length,
                    schemesInvolved: Array.from(targetSchemes)
                }
            });

        } catch (error: any) {
            console.error('Network fetch error:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch network' });
        }
    }
}
