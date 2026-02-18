import express, { Request, Response } from 'express';
import { fuelMonitoringService } from '../services/fuelMonitoringService';
import { canaryApiService } from '../services/canaryApiService';
import { adminAuth } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/fuel/check
 * Manually trigger a fuel level check
 */
router.post('/check', adminAuth, async (_req: Request, res: Response) => {
    try {
        console.log('🔍 Manual fuel check triggered via API');

        await fuelMonitoringService.checkFuelLevels();

        res.status(200).json({
            success: true,
            message: 'Fuel level check completed successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error during manual fuel check:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check fuel levels',
            error: error.message,
        });
    }
});

/**
 * GET /api/fuel/status
 * Get current fuel tank status from Canary API
 */
router.get('/status', adminAuth, async (_req: Request, res: Response) => {
    try {
        console.log('📊 Fetching current fuel status via API');

        const inventories = await canaryApiService.getInventories();
        const thresholds = fuelMonitoringService.getThresholds();

        // Add threshold information to each tank
        const tanksWithStatus = inventories.map((tank: any) => {
            const threshold = thresholds[tank.productLabel as keyof typeof thresholds] || 500;
            const percentageFull = tank.fullVolumeGallons > 0
                ? (tank.volumeGallons / tank.fullVolumeGallons) * 100
                : 0;

            return {
                tankNumber: tank.tankNumber,
                productLabel: tank.productLabel,
                volumeGallons: tank.volumeGallons,
                fullVolumeGallons: tank.fullVolumeGallons,
                percentageFull: percentageFull.toFixed(1),
                threshold,
                isLow: tank.volumeGallons < threshold,
                status: tank.status,
                inventoryDate: tank.inventoryDate,
                site: tank.site,
            };
        });

        res.status(200).json({
            success: true,
            tanks: tanksWithStatus,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching fuel status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch fuel status',
            error: error.message,
        });
    }
});

export { router as fuelRoutes };
