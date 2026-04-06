import { canaryApiService } from './canaryApiService';
import { TankInventory, FuelThresholds, LowFuelAlert, FuelPriceQuote } from '../types/fuelTypes';
import { sendFuelAlertEmail, sendFuelDeliveryEmail } from './resendEmailService';
import { sendFuelAlertNotification, sendFuelDeliveryNotification } from './notificationService';
import { sendFuelAlertSms, sendFuelDeliverySms } from './smsService';
import { outlookEmailService } from './outlookEmailService';
import { FuelDelivery } from '../models/FuelDelivery';
import dotenv from 'dotenv';


dotenv.config();

/**
 * Fuel Monitoring Service
 * Checks fuel levels and sends notifications when tanks are low
 */
class FuelMonitoringService {
    private thresholds: FuelThresholds;

    constructor() {
        // Load thresholds from environment variables
        this.thresholds = {
            REGULAR: parseInt(process.env.FUEL_THRESHOLD_REGULAR || '1000'),
            PREMIUM: parseInt(process.env.FUEL_THRESHOLD_PREMIUM || '600'),
            DIESEL: parseInt(process.env.FUEL_THRESHOLD_DIESEL || '600'),
            'REC FUEL': parseInt(process.env.FUEL_THRESHOLD_REC_FUEL || '500'),
        };

        console.log('⚙️ Fuel monitoring thresholds:', this.thresholds);
    }

    /**
     * Get the threshold for a specific product type
     */
    private getThreshold(productLabel: string): number {
        return this.thresholds[productLabel as keyof FuelThresholds] || 500;
    }

    /**
     * Check if a tank is below threshold
     */
    private isBelowThreshold(tank: TankInventory): boolean {
        const threshold = this.getThreshold(tank.productLabel);
        return tank.volumeGallons < threshold;
    }

    /**
     * Calculate percentage full
     */
    private calculatePercentageFull(tank: TankInventory): number {
        if (tank.fullVolumeGallons === 0) return 0;
        return (tank.volumeGallons / tank.fullVolumeGallons) * 100;
    }


    /**
     * Send low fuel alerts for tanks below threshold
     */
    private async sendLowFuelAlerts(lowFuelTanks: LowFuelAlert[]): Promise<void> {
        if (lowFuelTanks.length === 0) {
            console.log('✅ All tanks have sufficient fuel');
            return;
        }

        console.log(`🚨 ${lowFuelTanks.length} tank(s) below threshold, sending alerts...`);

        try {
            // Send email notification
            await sendFuelAlertEmail(lowFuelTanks);

            // Send push notification
            await sendFuelAlertNotification(lowFuelTanks);

            // Send SMS (only 8am–8pm Detroit time)
            await sendFuelAlertSms(lowFuelTanks);
        } catch (error) {
            console.error('❌ Error sending fuel alerts:', error);
            throw error;
        }
    }

    /**
     * Main function to check fuel levels and send notifications
     */
    async checkFuelLevels(): Promise<void> {
        try {
            console.log('\n🔍 ========== FUEL LEVEL CHECK STARTED ==========');
            console.log(`⏰ Check time: ${new Date().toLocaleString()}`);

            // Fetch tank inventories from Canary API
            const inventories: TankInventory[] = await canaryApiService.getInventories();

            if (!inventories || inventories.length === 0) {
                console.log('⚠️ No tank inventories found');
                return;
            }

            console.log(`\n📊 Checking ${inventories.length} tank(s):`);

            const lowFuelTanks: LowFuelAlert[] = [];

            // Check each tank
            for (const tank of inventories) {
                const threshold = this.getThreshold(tank.productLabel);
                const isLow = this.isBelowThreshold(tank);
                const percentageFull = this.calculatePercentageFull(tank);

                console.log(`\n🔹 Tank ${tank.tankNumber} - ${tank.productLabel}`);
                console.log(`   Current: ${tank.volumeGallons.toFixed(1)} gallons`);
                console.log(`   Capacity: ${tank.fullVolumeGallons} gallons (${percentageFull.toFixed(1)}% full)`);
                console.log(`   Threshold: ${threshold} gallons`);
                console.log(`   Status: ${isLow ? '🚨 LOW' : '✅ OK'} (API: ${tank.status})`);

                // Always alert if tank is low
                if (isLow) {
                    console.log(`   ⚠️ LOW - Will send alert`);
                    lowFuelTanks.push({
                        tank,
                        threshold,
                        percentageFull,
                    });
                }
            }

            // Send alerts if any tanks are low
            if (lowFuelTanks.length > 0) {
                await this.sendLowFuelAlerts(lowFuelTanks);
            }

            console.log('\n✅ ========== FUEL LEVEL CHECK COMPLETED ==========\n');
        } catch (error: any) {
            console.error('\n❌ ========== FUEL LEVEL CHECK FAILED ==========');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }

    /**
     * Fetch delivery report, save new deliveries to MongoDB, and notify admin if new ones found
     */
    async detectAndSaveNewDeliveries(): Promise<void> {
        try {
            console.log('\n📦 ========== DELIVERY DETECTION STARTED ==========');
            const siteId = parseInt(process.env.CANARY_SITE_ID || '5534');
            const report = await canaryApiService.getDeliveryReport(siteId);
            
            if (report.tanks.length === 0) {
                console.log('ℹ️ No delivery data available from API (this is normal if no recent deliveries)');
                console.log('✅ ========== DELIVERY DETECTION COMPLETED ==========\n');
                return;
            }
            
            console.log(`📊 Received delivery data for ${report.tanks.length} tank(s)`);

            const newDeliveries: {
                tankNumber: number;
                productLabel: string;
                gallonsDelivered: number;
                startVolume: number;
                endVolume: number;
                startDate: string;
                startTime: string;
                endDate: string;
                endTime: string;
            }[] = [];

            for (const tank of report.tanks) {
                for (const delivery of tank.deliveries) {
                    try {
                        // insertOne — will throw E11000 duplicate key error if already exists (that's fine)
                        await FuelDelivery.create({
                            tankNumber: tank.tankNumber,
                            productLabel: tank.productLabel,
                            startDate: delivery.startDate,
                            startTime: delivery.startTime,
                            endDate: delivery.endDate,
                            endTime: delivery.endTime,
                            startVolume: delivery.startVolume,
                            endVolume: delivery.endVolume,
                            gallonsDelivered: delivery.gallonsDelivered,
                            startTCVolume: delivery.startTCVolume,
                            endTCVolume: delivery.endTCVolume,
                            tcGallonsDelivered: delivery.tcGallonsDelivered,
                            startWaterHeight: delivery.startWaterHeight,
                            endWaterHeight: delivery.endWaterHeight,
                            startFuelTemp: delivery.startFuelTemp,
                            endFuelTemp: delivery.endFuelTemp,
                            startFuelHeight: delivery.startFuelHeight,
                            endFuelHeight: delivery.endFuelHeight,
                            notificationSent: false,
                        });

                        console.log(`✅ NEW delivery saved: Tank ${tank.tankNumber} (${tank.productLabel}) — ${delivery.gallonsDelivered} gal on ${delivery.startDate}`);
                        newDeliveries.push({
                            tankNumber: tank.tankNumber,
                            productLabel: tank.productLabel,
                            gallonsDelivered: delivery.gallonsDelivered,
                            startVolume: delivery.startVolume,
                            endVolume: delivery.endVolume,
                            startDate: delivery.startDate,
                            startTime: delivery.startTime,
                            endDate: delivery.endDate,
                            endTime: delivery.endTime,
                        });
                    } catch (err: any) {
                        if (err.code === 11000) {
                            // Duplicate key — delivery already recorded, skip silently
                        } else {
                            console.error(`❌ Error saving delivery for Tank ${tank.tankNumber}:`, err.message);
                        }
                    }
                }
            }

            if (newDeliveries.length > 0) {
                console.log(`🚨 ${newDeliveries.length} new delivery(ies) detected`);

                // IMPORTANT: Only send notifications for deliveries after March 8, 2026
                // This prevents spam from historical deliveries on first production run
                const cutoffDate = new Date('2026-03-08T23:59:59-05:00'); // March 8, 2026 end of day (Detroit time)
                
                // Filter deliveries: only notify for those after cutoff date
                const deliveriesToNotify = newDeliveries.filter(d => {
                    // Parse delivery date (format: MM/DD/YY)
                    const [month, day, year] = d.startDate.split('/').map(x => parseInt(x));
                    const fullYear = 2000 + year; // Convert YY to YYYY
                    const deliveryDate = new Date(fullYear, month - 1, day);
                    return deliveryDate > cutoffDate;
                });

                const deliveriesBeforeCutoff = newDeliveries.filter(d => {
                    const [month, day, year] = d.startDate.split('/').map(x => parseInt(x));
                    const fullYear = 2000 + year;
                    const deliveryDate = new Date(fullYear, month - 1, day);
                    return deliveryDate <= cutoffDate;
                });

                // Mark old deliveries as notified without sending alerts
                if (deliveriesBeforeCutoff.length > 0) {
                    console.log(`📅 ${deliveriesBeforeCutoff.length} delivery(ies) before March 8, 2026 - SKIPPING notifications (historical data)`);
                    for (const delivery of deliveriesBeforeCutoff) {
                        await FuelDelivery.updateOne(
                            {
                                tankNumber: delivery.tankNumber,
                                startDate: delivery.startDate,
                                startTime: delivery.startTime,
                                notificationSent: false,
                            },
                            { notificationSent: true }
                        );
                    }
                    console.log(`✅ Marked ${deliveriesBeforeCutoff.length} historical delivery(ies) as notified (no alerts sent)`);
                }

                // Send notifications for deliveries after cutoff
                if (deliveriesToNotify.length > 0) {
                    console.log(`📤 Sending notifications for ${deliveriesToNotify.length} delivery(ies) after March 8, 2026...`);

                    // Fetch latest fuel price quote from RKA email (non-blocking on failure)
                    let priceQuotes: FuelPriceQuote[] = [];
                    try {
                        priceQuotes = await outlookEmailService.getLatestFuelPriceQuotes(2);
                    } catch (err) {
                        console.error('⚠️ Could not fetch fuel price quote (will send notification without prices):', err);
                    }

                    // Send email (non-blocking) — includes price quote if available
                    sendFuelDeliveryEmail(deliveriesToNotify, priceQuotes)
                        .then(async () => {
                            // Mark notifications as sent for each specific delivery
                            for (const delivery of deliveriesToNotify) {
                                await FuelDelivery.updateOne(
                                    {
                                        tankNumber: delivery.tankNumber,
                                        startDate: delivery.startDate,
                                        startTime: delivery.startTime,
                                        notificationSent: false,
                                    },
                                    { notificationSent: true }
                                );
                            }
                            console.log(`✅ Marked ${deliveriesToNotify.length} delivery(ies) as notified`);
                        })
                        .catch(err => console.error('Failed to send delivery email:', err));

                    // Send SMS (non-blocking)
                    sendFuelDeliverySms(deliveriesToNotify)
                        .catch(err => console.error('Failed to send delivery SMS:', err));

                    // Send push notification (non-blocking)
                    sendFuelDeliveryNotification(deliveriesToNotify)
                        .catch(err => console.error('Failed to send delivery push:', err));
                } else {
                    console.log(`ℹ️ All ${newDeliveries.length} new delivery(ies) are before March 8, 2026 - no notifications sent`);
                }
            } else {
                console.log('✅ No new deliveries detected this run');
            }

            console.log('✅ ========== DELIVERY DETECTION COMPLETED ==========\n');
        } catch (error: any) {
            console.error('❌ Delivery detection error:', error.message);
            // Don't re-throw — let the cron job continue even if delivery check fails
        }
    }

    /**
     * Get fuel thresholds for display/debugging
     */
    getThresholds(): FuelThresholds {
        return this.thresholds;
    }
}

// Export singleton instance
export const fuelMonitoringService = new FuelMonitoringService();

