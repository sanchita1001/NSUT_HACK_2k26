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

            // 1. Identify Schemes and Beneficiaries the target vendor is involved in
            const targetVendorAlerts = alerts.filter(a => a.vendor === targetVendor.name);
            const targetSchemes = new Set(targetVendorAlerts.map(a => a.scheme));
            const targetBeneficiaries = new Set(targetVendorAlerts.map(a => a.beneficiary).filter(b => b && b !== 'Unknown'));

            // 2. Find other vendors in the same schemes OR paying same beneficiaries (Collusion Risk)
            const relatedVendorsMap = new Map<string, { schemes: Set<string>, beneficiaries: Set<string> }>();

            alerts.forEach(alert => {
                const alertVendor = alert.vendor;
                if (alertVendor !== targetVendor.name) {
                    // Check Scheme Overlap
                    const hasSchemeOverlap = targetSchemes.has(alert.scheme);
                    // Check Beneficiary Overlap
                    const hasBeneficiaryOverlap = targetBeneficiaries.has(alert.beneficiary);

                    if (hasSchemeOverlap || hasBeneficiaryOverlap) {
                        if (!relatedVendorsMap.has(alertVendor)) {
                            relatedVendorsMap.set(alertVendor, { schemes: new Set(), beneficiaries: new Set() });
                        }
                        const entry = relatedVendorsMap.get(alertVendor)!;
                        if (hasSchemeOverlap) entry.schemes.add(alert.scheme);
                        if (hasBeneficiaryOverlap) entry.beneficiaries.add(alert.beneficiary);
                    }
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
                    id: targetVendor.id, // Explicitly pass ID for frontend linking
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
                const relation = relatedVendorsMap.get(vendor.name);
                const sharedSchemes = relation?.schemes || new Set();
                const sharedBeneficiaries = relation?.beneficiaries || new Set();

                const schemeCount = sharedSchemes.size;
                const beneficiaryCount = sharedBeneficiaries.size;
                const totalShared = schemeCount + beneficiaryCount;

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
                        id: vendor.id, // Explicitly pass ID for frontend linking
                        riskScore: vendor.riskScore,
                        sharedSchemes: Array.from(sharedSchemes).join(', '),
                        sharedBeneficiaries: Array.from(sharedBeneficiaries).join(', ')
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
                // Differentiate edge style based on connection type
                let edgeColor = '#94a3b8'; // Default grey
                let edgeLabel = `${schemeCount} Shared Scheme${schemeCount !== 1 ? 's' : ''}`;

                if (beneficiaryCount > 0) {
                    edgeColor = '#dc2626'; // Red for shared beneficiary (stronger signal)
                    edgeLabel = `⚠️ Shared Beneficiary!`;
                }

                edges.push({
                    id: `e-${targetVendor.id}-${vendor.id}`,
                    source: targetVendor.id,
                    target: vendor.id,
                    label: edgeLabel,
                    type: 'straight',
                    animated: isHighRisk || beneficiaryCount > 0,
                    style: {
                        stroke: edgeColor,
                        strokeWidth: Math.min(totalShared, 5) + (beneficiaryCount > 0 ? 2 : 0)
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
