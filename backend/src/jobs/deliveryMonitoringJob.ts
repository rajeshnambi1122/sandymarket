import cron from 'node-cron';
import { fuelMonitoringService } from '../services/fuelMonitoringService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Start the fuel delivery monitoring cron job
 * Checks for new deliveries every hour
 */
export const startDeliveryMonitoring = (): void => {
    const intervalHours = parseFloat(process.env.DELIVERY_CHECK_INTERVAL_HOURS || '1');

    // Convert hours to cron expression
    let cronExpression: string;

    if (intervalHours < 1) {
        // Run every X minutes
        const minutes = Math.floor(intervalHours * 60);
        cronExpression = `*/${minutes} * * * *`;
        console.log(`⚙️ Delivery monitoring will run every ${minutes} minute(s)`);
    } else {
        // Run every X hours
        const hours = Math.floor(intervalHours);
        cronExpression = `0 */${hours} * * *`;
        console.log(`⚙️ Delivery monitoring will run every ${hours} hour(s)`);
    }

    // Schedule the cron job
    cron.schedule(cronExpression, async () => {
        console.log('\n📦 Cron job triggered - Running delivery detection...');

        try {
            await fuelMonitoringService.detectAndSaveNewDeliveries();
        } catch (error) {
            console.error('❌ Delivery detection cron job error:', error);
        }
    }, {
        timezone: "America/New_York" // Match the site timezone
    });

    console.log('✅ Delivery monitoring cron job started successfully');
    console.log(`📅 Cron expression: ${cronExpression}`);
    console.log(`⏱️ Check interval: ${intervalHours} hour(s)`);

    // Run an initial check on startup (optional, after a short delay)
    setTimeout(async () => {
        console.log('\n🚀 Running initial delivery detection on startup...');
        try {
            await fuelMonitoringService.detectAndSaveNewDeliveries();
        } catch (error) {
            console.error('❌ Initial delivery detection error:', error);
        }
    }, 15000); // Wait 15 seconds after startup (after fuel check)
};

/**
 * Stop delivery monitoring (for graceful shutdown)
 */
export const stopDeliveryMonitoring = (): void => {
    cron.getTasks().forEach((task: any) => task.stop());
    console.log('🛑 Delivery monitoring cron job stopped');
};
