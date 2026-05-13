import { canaryApiService } from './canaryApiService';
import { TankInventory, FuelThresholds, FuelPriceQuote, TankStatusReportEntry } from '../types/fuelTypes';
import { sendFuelStatusReportEmail, sendFuelDeliveryEmail } from './resendEmailService';
import { sendFuelStatusReportNotification, sendFuelDeliveryNotification } from './notificationService';
import { sendFuelStatusReportSms, sendFuelDeliverySms } from './smsService';
import { outlookEmailService } from './outlookEmailService';
import { FuelDelivery } from '../models/FuelDelivery';
import { FuelInventorySnapshot } from '../models/FuelInventorySnapshot';
import { FuelDailySales } from '../models/FuelDailySales';
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

    private getReportPeriod(now = new Date()): 'Morning' | 'Night' {
        const detroitHour = parseInt(
            new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Detroit',
                hour: 'numeric',
                hour12: false,
            }).format(now),
            10
        );

        return detroitHour < 12 ? 'Morning' : 'Night';
    }

    private getDetroitDateKey(now = new Date()): string {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Detroit',
            month: '2-digit',
            day: '2-digit',
            year: '2-digit',
        }).format(now);
    }

    private async saveInventorySnapshot(
        inventories: TankInventory[],
        period: 'Morning' | 'Night',
        dateKey: string
    ): Promise<void> {
        await Promise.all(
            inventories.map((tank) =>
                FuelInventorySnapshot.updateOne(
                    { dateKey, period, tankNumber: tank.tankNumber },
                    {
                        dateKey,
                        period,
                        tankNumber: tank.tankNumber,
                        productLabel: tank.productLabel,
                        volumeGallons: tank.volumeGallons,
                        inventoryDate: tank.inventoryDate,
                        updatedAt: new Date(),
                    },
                    { upsert: true }
                )
            )
        );
    }

    private async cleanupStaleSnapshots(currentDateKey: string): Promise<void> {
        const result = await FuelInventorySnapshot.deleteMany({
            dateKey: { $ne: currentDateKey },
        });

        if (result.deletedCount && result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} stale fuel snapshot(s)`);
        }
    }

    private async clearCurrentDaySnapshots(dateKey: string): Promise<void> {
        const result = await FuelInventorySnapshot.deleteMany({ dateKey });

        if (result.deletedCount && result.deletedCount > 0) {
            console.log(`Cleared ${result.deletedCount} fuel snapshot(s) for ${dateKey}`);
        }
    }

    private detroitWallNumber(date: Date): number {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Detroit',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);

        const map: Record<string, number> = {};
        for (const part of parts) {
            if (part.type !== 'literal') {
                map[part.type] = parseInt(part.value, 10);
            }
        }
        // Intl sometimes emits hour=24 for midnight
        const hour = map.hour === 24 ? 0 : map.hour;
        return map.year * 1e8 + map.month * 1e6 + map.day * 1e4 + hour * 100 + map.minute;
    }

    private parseDeliveryWallNumber(startDate: string, startTime: string): number | null {
        const dateParts = startDate.split('/').map((s) => parseInt(s, 10));
        if (dateParts.length !== 3 || dateParts.some((n) => Number.isNaN(n))) return null;
        const [mm, dd, yy] = dateParts;

        const timeMatch = startTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!timeMatch) return null;
        let hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2], 10);
        const meridiem = timeMatch[3].toUpperCase();
        if (meridiem === 'PM' && hour !== 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;

        const fullYear = 2000 + yy;
        return fullYear * 1e8 + mm * 1e6 + dd * 1e4 + hour * 100 + minute;
    }

    private async getDailySalesByProduct(
        inventories: TankInventory[],
        period: 'Morning' | 'Night',
        dateKey: string
    ): Promise<Record<string, number>> {
        const salesByProduct: Record<string, number> = {};
        const uniqueProducts = [...new Set(inventories.map((tank) => tank.productLabel))];

        for (const product of uniqueProducts) {
            salesByProduct[product] = 0;
        }

        if (period !== 'Night') {
            return salesByProduct;
        }

        const morningSnapshots = await FuelInventorySnapshot.find({
            dateKey,
            period: 'Morning',
        }).lean();

        if (morningSnapshots.length === 0) {
            console.warn(`No morning snapshots found for ${dateKey}; night sales will show as 0`);
            return salesByProduct;
        }

        const morningByTank = new Map<number, number>();
        const morningCutoffByTank = new Map<number, number>();
        for (const snapshot of morningSnapshots) {
            morningByTank.set(snapshot.tankNumber, snapshot.volumeGallons);
            const createdAt = (snapshot as any).createdAt instanceof Date
                ? (snapshot as any).createdAt
                : new Date((snapshot as any).createdAt);
            morningCutoffByTank.set(snapshot.tankNumber, this.detroitWallNumber(createdAt));
        }

        const tankNumbers = inventories.map((tank) => tank.tankNumber);
        const deliveries = await FuelDelivery.find({
            startDate: dateKey,
            tankNumber: { $in: tankNumbers },
        }).lean();

        const deliveredByTank: Record<number, number> = {};
        let skippedBeforeMorning = 0;
        for (const delivery of deliveries) {
            const cutoff = morningCutoffByTank.get(delivery.tankNumber);
            const deliveryWall = this.parseDeliveryWallNumber(delivery.startDate, delivery.startTime);

            if (cutoff !== undefined && deliveryWall !== null && deliveryWall < cutoff) {
                skippedBeforeMorning += 1;
                console.log(
                    `Skipping delivery for tank ${delivery.tankNumber} at ${delivery.startDate} ${delivery.startTime} ` +
                    `(${delivery.gallonsDelivered} gal): occurred before morning snapshot, already reflected in opening volume`
                );
                continue;
            }

            deliveredByTank[delivery.tankNumber] = (deliveredByTank[delivery.tankNumber] || 0) + delivery.gallonsDelivered;
        }

        if (skippedBeforeMorning > 0) {
            console.log(`Excluded ${skippedBeforeMorning} pre-morning delivery row(s) from today's sales math`);
        }

        for (const tank of inventories) {
            const openingVolume = morningByTank.get(tank.tankNumber);
            if (openingVolume === undefined) {
                continue;
            }

            const gallonsDeliveredToday = deliveredByTank[tank.tankNumber] || 0;
            const estimatedSold = Math.max(0, openingVolume + gallonsDeliveredToday - tank.volumeGallons);
            salesByProduct[tank.productLabel] = (salesByProduct[tank.productLabel] || 0) + estimatedSold;
        }

        return salesByProduct;
    }

    private async buildTankStatusReport(
        inventories: TankInventory[],
        period: 'Morning' | 'Night',
        dateKey: string
    ): Promise<{ report: TankStatusReportEntry[]; nightSalesByProduct: Record<string, number> | null }> {
        const dailySalesByProduct = await this.getDailySalesByProduct(inventories, period, dateKey);

        const report = inventories.map((tank) => {
            const threshold = this.getThreshold(tank.productLabel);
            const percentageFull = this.calculatePercentageFull(tank);
            const isLow = this.isBelowThreshold(tank);
            const ullagePercentGallons = tank.ullage90PercentGallons;

            return {
                tank,
                threshold,
                percentageFull,
                isLow,
                ullagePercentGallons,
                todaysSalesGallons: period === 'Night' ? dailySalesByProduct[tank.productLabel] || 0 : null,
            };
        });

        return {
            report,
            nightSalesByProduct: period === 'Night' ? dailySalesByProduct : null,
        };
    }

    private async saveFuelDailySales(dateKey: string, salesByProduct: Record<string, number>): Promise<void> {
        const lines = Object.entries(salesByProduct).map(([productLabel, gallonsSold]) => ({
            productLabel,
            gallonsSold,
        }));

        await FuelDailySales.findOneAndUpdate(
            { dateKey },
            {
                dateKey,
                lines,
                recordedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log(`Saved fuel daily sales for ${dateKey} (${lines.length} product type(s))`);
    }

    private async sendTankStatusReport(
        report: TankStatusReportEntry[],
        period: 'Morning' | 'Night'
    ): Promise<void> {
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

            const period = this.getReportPeriod();
            const dateKey = this.getDetroitDateKey();

            await this.cleanupStaleSnapshots(dateKey);
            await this.saveInventorySnapshot(inventories, period, dateKey);
            const { report, nightSalesByProduct } = await this.buildTankStatusReport(inventories, period, dateKey);

            if (nightSalesByProduct) {
                await this.saveFuelDailySales(dateKey, nightSalesByProduct);
            }

            for (const entry of report) {
                const { tank, threshold, isLow, percentageFull, ullagePercentGallons, todaysSalesGallons } = entry;

                console.log(`\nTank ${tank.tankNumber} - ${tank.productLabel}`);
                console.log(`   Current: ${tank.volumeGallons.toFixed(1)} gallons`);
                console.log(`   Capacity: ${tank.fullVolumeGallons} gallons (${percentageFull.toFixed(1)}% full)`);
                console.log(`   Threshold: ${threshold} gallons`);
                console.log(`   Status: ${isLow ? 'LOW' : 'OK'} (API: ${tank.status})`);
                console.log(`   Ullage 90%: ${ullagePercentGallons.toFixed(1)} gallons`);
                if (todaysSalesGallons !== null) {
                    console.log(`   Today's sales (${tank.productLabel}): ${todaysSalesGallons.toFixed(1)} gallons`);
                }
            }

            await this.sendTankStatusReport(report, period);

            if (period === 'Night') {
                await this.clearCurrentDaySnapshots(dateKey);
            }

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
