import { canaryApiService } from './canaryApiService';
import { TankInventory, FuelThresholds, LowFuelAlert } from '../types/fuelTypes';
import { sendFuelAlertEmail } from './resendEmailService';
import { sendFuelAlertNotification } from './notificationService';
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
     * Get fuel thresholds for display/debugging
     */
    getThresholds(): FuelThresholds {
        return this.thresholds;
    }
}

// Export singleton instance
export const fuelMonitoringService = new FuelMonitoringService();
