import express, { Request, Response } from 'express';
import { fuelMonitoringService } from '../services/fuelMonitoringService';
import { canaryApiService } from '../services/canaryApiService';
import { gasBuddyService } from '../services/gasBuddyService';
import { sendGasBuddyPriceEmail } from '../services/resendEmailService';
import { sendGasBuddyPriceSms } from '../services/smsService';
import { sendGasBuddyPriceNotification } from '../services/notificationService';
import { outlookEmailService } from '../services/outlookEmailService';
import { adminAuth } from "../middleware/auth";
import { FuelDelivery } from '../models/FuelDelivery';

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
        res.status(500).json({ success: false, message: 'Failed to check fuel levels', error: error.message });
    }
});

/**
 * GET /api/fuel/status
 * Get current fuel tank status from Canary API
 */
router.get('/status', adminAuth, async (_req: Request, res: Response) => {
    try {
        const inventories = await canaryApiService.getInventories();
        const thresholds = fuelMonitoringService.getThresholds();

        const tanksWithStatus = inventories.map((tank: any) => {
            const threshold = thresholds[tank.productLabel as keyof typeof thresholds] || 500;
            const percentageFull = tank.fullVolumeGallons > 0
                ? (tank.volumeGallons / tank.fullVolumeGallons) * 100 : 0;
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

        res.status(200).json({ success: true, tanks: tanksWithStatus, timestamp: new Date().toISOString() });
    } catch (error: any) {
        console.error('Error fetching fuel status:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch fuel status', error: error.message });
    }
});

/**
 * GET /api/fuel/deliveries
 * Return delivery history from MongoDB
 * Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&tankNumber=1
 */
router.get('/deliveries', adminAuth, async (req: Request, res: Response) => {
    try {
        const { from, to, tankNumber } = req.query;

        const filter: any = {};
        if (tankNumber) filter.tankNumber = parseInt(tankNumber as string);
        if (from || to) {
            filter.detectedAt = {};
            if (from) filter.detectedAt.$gte = new Date(from as string);
            if (to) filter.detectedAt.$lte = new Date(to as string);
        }

        const deliveries = await FuelDelivery.find(filter).sort({ detectedAt: -1 }).limit(200);

        // Group by product label for summary
        const summary: Record<string, { totalGallons: number; deliveryCount: number }> = {};
        for (const d of deliveries) {
            if (!summary[d.productLabel]) summary[d.productLabel] = { totalGallons: 0, deliveryCount: 0 };
            summary[d.productLabel].totalGallons += d.gallonsDelivered;
            summary[d.productLabel].deliveryCount += 1;
        }

        res.status(200).json({
            success: true,
            count: deliveries.length,
            summary,
            deliveries,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('❌ Error fetching deliveries from DB:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch deliveries', error: error.message });
    }
});

/**
 * POST /api/fuel/deliveries/check
 * Manually trigger delivery detection right now
 * Useful for testing or on-demand checks
 */
router.post('/deliveries/check', adminAuth, async (_req: Request, res: Response) => {
    try {
        console.log('📦 Manual delivery detection triggered via API');
        await fuelMonitoringService.detectAndSaveNewDeliveries();
        res.status(200).json({
            success: true,
            message: 'Delivery detection complete. Check logs for new deliveries.',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('❌ Manual delivery detection error:', error);
        res.status(500).json({ success: false, message: 'Failed to detect deliveries', error: error.message });
    }
});

/**
 * GET /api/fuel/sandyprice
 * Fetch current gas prices from Sandy location
 * Scrapes data from GasBuddy
 */
router.get('/sandyprice', async (_req: Request, res: Response) => {
    try {
        const prices = await gasBuddyService.getSandyPrices();
        
        res.status(200).json({
            success: true,
            data: prices,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('❌ Failed to fetch gas prices:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gas prices from GasBuddy',
            error: error.message,
        });
    }
});

router.get('/bigrprice', async (_req: Request, res: Response) => {
    try {
        const prices = await gasBuddyService.getBigRPrices();
        
        res.status(200).json({
            success: true,
            data: prices,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('❌ Failed to fetch gas prices:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gas prices from GasBuddy',
            error: error.message,
        });
    }
});

/**
 * GET /api/fuel/quote-price
 * Fetch the latest RKA quote details from Outlook
 * Useful for warming up Microsoft auth on production and verifying quote parsing
 */
router.get('/quote-price', adminAuth, async (_req: Request, res: Response) => {
    try {
        const quote = await outlookEmailService.getLatestFuelPriceQuote();

        if (!quote) {
            return res.status(404).json({
                success: false,
                message: 'No fuel price quote found or Outlook authentication is still pending. Check Railway logs for the Microsoft device-code sign-in prompt.',
                timestamp: new Date().toISOString(),
            });
        }

        return res.status(200).json({
            success: true,
            data: quote,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Failed to fetch fuel price quote:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch fuel price quote',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * POST /api/fuel/gasbuddy-report
 * Manually trigger Gas Buddy daily price report
 * Sends Email, SMS, and Push Notification to admin1 and FUEL_ALERT_PHONE
 */
router.post('/gasbuddy-report', async (_req: Request, res: Response) => {
    try {
        console.log('\n💰 ========== MANUAL GAS BUDDY REPORT TRIGGERED ==========');
        
        const comparison = await gasBuddyService.comparePrices();
        
        console.log('📤 Sending notifications...');
        
        const notifications = [
            sendGasBuddyPriceEmail(comparison)
                .then(() => console.log('✅ Email sent successfully'))
                .catch(err => console.error('❌ Email failed:', err.message)),

            sendGasBuddyPriceSms(comparison)
                .then(() => console.log('✅ SMS sent successfully'))
                .catch(err => console.error('❌ SMS failed:', err.message)),

            sendGasBuddyPriceNotification(comparison)
                .then(() => console.log('✅ Push notification sent successfully'))
                .catch(err => console.error('❌ Push notification failed:', err.message)),
        ];

        await Promise.allSettled(notifications);
        
        console.log('✅ ========== MANUAL GAS BUDDY REPORT COMPLETED ==========\n');
        
        res.status(200).json({
            success: true,
            message: 'Gas Buddy price report sent successfully',
            data: comparison,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('❌ Failed to send Gas Buddy report:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send Gas Buddy price report',
            error: error.message,
        });
    }
});

export { router as fuelRoutes };
