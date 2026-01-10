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

            // Find all vendors
            const allVendors = await Vendor.find();

            // Build graph nodes and edges
            const nodes: any[] = [];
            const edges: any[] = [];

            // Add target vendor as central node
            nodes.push({
                id: targetVendor.id,
                data: { label: targetVendor.name },
                position: { x: 250, y: 250 },
                style: {
                    background: '#ef4444',
                    color: 'white',
                    border: '2px solid #991b1b',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }
            });

            // Find related vendors (for demo: vendors with similar risk scores or from same alerts)
            const alerts = await Alert.find({ vendor: targetVendor.name });
            const relatedVendorNames = new Set(alerts.map(a => a.vendor));

            let angle = 0;
            const radius = 200;
            const angleStep = (2 * Math.PI) / Math.max(relatedVendorNames.size, 1);

            relatedVendorNames.forEach((vendorName) => {
                if (vendorName !== targetVendor.name) {
                    const vendor = allVendors.find(v => v.name === vendorName);
                    if (vendor) {
                        const x = 250 + radius * Math.cos(angle);
                        const y = 250 + radius * Math.sin(angle);

                        nodes.push({
                            id: vendor.id,
                            data: { label: vendor.name },
                            position: { x, y },
                            style: {
                                background: vendor.riskScore > 70 ? '#f97316' : '#3b82f6',
                                color: 'white',
                                border: '1px solid #1e40af',
                                borderRadius: '6px',
                                padding: '8px',
                                fontSize: '12px'
                            }
                        });

                        edges.push({
                            id: `${targetVendor.id}-${vendor.id}`,
                            source: targetVendor.id,
                            target: vendor.id,
                            label: 'Shared Transactions',
                            animated: true,
                            style: { stroke: '#94a3b8' }
                        });

                        angle += angleStep;
                    }
                }
            });

            // If no related vendors, add some sample connections for demo
            if (nodes.length === 1) {
                const sampleVendors = allVendors.filter(v => v.id !== targetVendor.id).slice(0, 3);
                sampleVendors.forEach((vendor, idx) => {
                    const angle = (idx / sampleVendors.length) * 2 * Math.PI;
                    const x = 250 + 150 * Math.cos(angle);
                    const y = 250 + 150 * Math.sin(angle);

                    nodes.push({
                        id: vendor.id,
                        data: { label: vendor.name },
                        position: { x, y },
                        style: {
                            background: '#6b7280',
                            color: 'white',
                            border: '1px solid #374151',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '12px'
                        }
                    });

                    edges.push({
                        id: `${targetVendor.id}-${vendor.id}`,
                        source: targetVendor.id,
                        target: vendor.id,
                        label: 'Potential Link',
                        style: { stroke: '#d1d5db', strokeDasharray: '5,5' }
                    });
                });
            }

            res.json({ nodes, edges });
        } catch (error: any) {
            console.error('Network fetch error:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch network' });
        }
    }
}
