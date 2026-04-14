import { canaryApiService } from './canaryApiService';
import { TankInventory, FuelThresholds, FuelPriceQuote, TankStatusReportEntry } from '../types/fuelTypes';
import { sendFuelStatusReportEmail, sendFuelDeliveryEmail } from './resendEmailService';
import { sendFuelStatusReportNotification, sendFuelDeliveryNotification } from './notificationService';
import { sendFuelStatusReportSms, sendFuelDeliverySms } from './smsService';
import { outlookEmailService } from './outlookEmailService';
import { FuelDelivery } from '../models/FuelDelivery';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fuel Monitoring Service
 * Fetches fuel levels and sends scheduled tank status reports
 */
class FuelMonitoringService {
    private thresholds: FuelThresholds;

    constructor() {
        this.thresholds = {
            REGULAR: parseInt(process.env.FUEL_THRESHOLD_REGULAR || '1000'),
            PREMIUM: parseInt(process.env.FUEL_THRESHOLD_PREMIUM || '600'),
            DIESEL: parseInt(process.env.FUEL_THRESHOLD_DIESEL || '600'),
            'REC FUEL': parseInt(process.env.FUEL_THRESHOLD_REC_FUEL || '500'),
        };

        console.log('Fuel monitoring thresholds:', this.thresholds);
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

    private getReportPeriod(now = new Date()): 'Morning' | 'Evening' {
        const detroitHour = parseInt(
            new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Detroit',
                hour: 'numeric',
                hour12: false,
            }).format(now),
            10
        );

        return detroitHour < 12 ? 'Morning' : 'Evening';
    }

    private buildTankStatusReport(inventories: TankInventory[]): TankStatusReportEntry[] {
        return inventories.map((tank) => {
            const threshold = this.getThreshold(tank.productLabel);
            const percentageFull = this.calculatePercentageFull(tank);
            const isLow = this.isBelowThreshold(tank);

            return {
                tank,
                threshold,
                percentageFull,
                isLow,
            };
        });
    }

    private async sendTankStatusReport(report: TankStatusReportEntry[]): Promise<void> {
        const period = this.getReportPeriod();
        const lowTankCount = report.filter((entry) => entry.isLow).length;
        console.log(`Sending ${period.toLowerCase()} tank status report for ${report.length} tank(s); ${lowTankCount} low`);

        await sendFuelStatusReportEmail(report, period);
        await sendFuelStatusReportNotification(report, period);
        await sendFuelStatusReportSms(report, period);
    }

    /**
     * Main function to fetch fuel levels and send the scheduled report
     */
    async checkFuelLevels(): Promise<void> {
        try {
            console.log('\n========== TANK STATUS REPORT STARTED ==========');
            console.log(`Run time: ${new Date().toLocaleString()}`);

            const inventories: TankInventory[] = await canaryApiService.getInventories();

            if (!inventories || inventories.length === 0) {
                console.log('No tank inventories found');
                return;
            }

            console.log(`\nChecking ${inventories.length} tank(s):`);

            const report = this.buildTankStatusReport(inventories);

            for (const entry of report) {
                const { tank, threshold, isLow, percentageFull } = entry;

                console.log(`\nTank ${tank.tankNumber} - ${tank.productLabel}`);
                console.log(`   Current: ${tank.volumeGallons.toFixed(1)} gallons`);
                console.log(`   Capacity: ${tank.fullVolumeGallons} gallons (${percentageFull.toFixed(1)}% full)`);
                console.log(`   Threshold: ${threshold} gallons`);
                console.log(`   Status: ${isLow ? 'LOW' : 'OK'} (API: ${tank.status})`);
            }

            await this.sendTankStatusReport(report);

            console.log('\n========== TANK STATUS REPORT COMPLETED ==========\n');
        } catch (error: any) {
            console.error('\n========== TANK STATUS REPORT FAILED ==========');
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
            console.log('\nDELIVERY DETECTION STARTED');
            const siteId = parseInt(process.env.CANARY_SITE_ID || '5534');
            const report = await canaryApiService.getDeliveryReport(siteId);

            if (report.tanks.length === 0) {
                console.log('No delivery data available from API (this is normal if no recent deliveries)');
                console.log('DELIVERY DETECTION COMPLETED\n');
                return;
            }

            console.log(`Received delivery data for ${report.tanks.length} tank(s)`);

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

                        console.log(`NEW delivery saved: Tank ${tank.tankNumber} (${tank.productLabel}) - ${delivery.gallonsDelivered} gal on ${delivery.startDate}`);
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
                        if (err.code !== 11000) {
                            console.error(`Error saving delivery for Tank ${tank.tankNumber}:`, err.message);
                        }
                    }
                }
            }

            if (newDeliveries.length > 0) {
                console.log(`${newDeliveries.length} new delivery(ies) detected`);

                const cutoffDate = new Date('2026-03-08T23:59:59-05:00');

                const deliveriesToNotify = newDeliveries.filter(d => {
                    const [month, day, year] = d.startDate.split('/').map(x => parseInt(x, 10));
                    const fullYear = 2000 + year;
                    const deliveryDate = new Date(fullYear, month - 1, day);
                    return deliveryDate > cutoffDate;
                });

                const deliveriesBeforeCutoff = newDeliveries.filter(d => {
                    const [month, day, year] = d.startDate.split('/').map(x => parseInt(x, 10));
                    const fullYear = 2000 + year;
                    const deliveryDate = new Date(fullYear, month - 1, day);
                    return deliveryDate <= cutoffDate;
                });

                if (deliveriesBeforeCutoff.length > 0) {
                    console.log(`${deliveriesBeforeCutoff.length} delivery(ies) before March 8, 2026 - skipping notifications`);
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
                    console.log(`Marked ${deliveriesBeforeCutoff.length} historical delivery(ies) as notified`);
                }

                if (deliveriesToNotify.length > 0) {
                    console.log(`Sending notifications for ${deliveriesToNotify.length} delivery(ies) after March 8, 2026...`);

                    let priceQuotes: FuelPriceQuote[] = [];
                    try {
                        priceQuotes = await outlookEmailService.getLatestFuelPriceQuotes(2);
                    } catch (err) {
                        console.error('Could not fetch fuel price quote (will send notification without prices):', err);
                    }

                    sendFuelDeliveryEmail(deliveriesToNotify, priceQuotes)
                        .then(async () => {
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
                            console.log(`Marked ${deliveriesToNotify.length} delivery(ies) as notified`);
                        })
                        .catch(err => console.error('Failed to send delivery email:', err));

                    sendFuelDeliverySms(deliveriesToNotify)
                        .catch(err => console.error('Failed to send delivery SMS:', err));

                    sendFuelDeliveryNotification(deliveriesToNotify)
                        .catch(err => console.error('Failed to send delivery push:', err));
                } else {
                    console.log(`All ${newDeliveries.length} new delivery(ies) are before March 8, 2026 - no notifications sent`);
                }
            } else {
                console.log('No new deliveries detected this run');
            }

            console.log('DELIVERY DETECTION COMPLETED\n');
        } catch (error: any) {
            console.error('Delivery detection error:', error.message);
        }
    }

    /**
     * Get fuel thresholds for display/debugging
     */
    getThresholds(): FuelThresholds {
        return this.thresholds;
    }
}

export const fuelMonitoringService = new FuelMonitoringService();
