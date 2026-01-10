import { Request, Response } from 'express';
import { Scheme } from '../models';

export class SchemeController {
    static async createScheme(req: Request, res: Response) {
        try {
            const { id, name, ministry, budgetAllocated, status, description } = req.body;

            const scheme = await Scheme.create({
                id,
                name,
                ministry,
                budgetAllocated,
                status: status || 'ACTIVE',
                description
            });

            res.status(201).json(scheme);
        } catch (error: any) {
            console.error('Create scheme error:', error);
            res.status(500).json({ error: error.message || 'Failed to create scheme' });
        }
    }

    static async updateScheme(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Find original scheme first to check for name change
            const originalScheme = await Scheme.findOne({ id });
            if (!originalScheme) {
                return res.status(404).json({ error: 'Scheme not found' });
            }

            const scheme = await Scheme.findOneAndUpdate(
                { id },
                updates,
                { new: true, runValidators: true }
            );

            // Check if name changed and propagate to Alerts
            if (updates.name && originalScheme.name !== updates.name) {
                const { Alert } = require('../models');
                const updateResult = await Alert.updateMany(
                    { scheme: originalScheme.name },
                    { $set: { scheme: updates.name } }
                );
                console.log(`Propagated scheme name change: ${originalScheme.name} -> ${updates.name} (${updateResult.modifiedCount} alerts updated)`);
            }

            res.json(scheme);
        } catch (error: any) {
            console.error('Update scheme error:', error);
            res.status(500).json({ error: error.message || 'Failed to update scheme' });
        }
    }

    static async getSchemes(req: Request, res: Response) {
        try {
            const schemes = await Scheme.find();

            // Get usage counts for each scheme
            const { Alert } = require('../models');
            const schemesWithUsage = await Promise.all(schemes.map(async (scheme) => {
                const alertCount = await Alert.countDocuments({ scheme: scheme.name });
                return {
                    ...scheme.toObject(),
                    usageCount: alertCount
                };
            }));

            res.json(schemesWithUsage);
        } catch (error: any) {
            console.error('Get schemes error:', error);
            res.status(500).json({ error: error.message || 'Failed to fetch schemes' });
        }
    }

    static async deleteScheme(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const scheme = await Scheme.findOne({ id });
            if (!scheme) {
                return res.status(404).json({ error: 'Scheme not found' });
            }

            // Check for dependencies in Alert collection
            const { Alert } = require('../models');
            const alertCount = await Alert.countDocuments({ scheme: scheme.name });

            if (alertCount > 0) {
                return res.status(409).json({
                    error: 'Cannot delete scheme with existing references',
                    message: `This scheme is referenced by ${alertCount} alert(s). Please resolve these dependencies before deletion.`,
                    dependencies: {
                        alerts: alertCount
                    }
                });
            }

            // No dependencies, safe to delete
            await Scheme.findOneAndDelete({ id });
            res.json({ message: 'Scheme deleted successfully', id });
        } catch (error: any) {
            console.error('Delete scheme error:', error);
            res.status(500).json({ error: error.message || 'Failed to delete scheme' });
        }
    }
}
