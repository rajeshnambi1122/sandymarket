import cron from 'node-cron';
import { fuelMonitoringService } from '../services/fuelMonitoringService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Start the fuel monitoring cron job
 * Checks fuel levels periodically based on FUEL_CHECK_INTERVAL_HOURS
 */
export const startFuelMonitoring = (): void => {
    const intervalHours = parseFloat(process.env.FUEL_CHECK_INTERVAL_HOURS || '4');

    // Convert hours to cron expression
    // For intervals less than 1 hour, use minutes
    let cronExpression: string;

    if (intervalHours < 1) {
        // Run every X minutes
        const minutes = Math.floor(intervalHours * 60);
        cronExpression = `*/${minutes} * * * *`;
        console.log(`⚙️ Fuel monitoring will run every ${minutes} minute(s)`);
    } else {
        // Run every X hours
        const hours = Math.floor(intervalHours);
        cronExpression = `0 */${hours} * * *`;
        console.log(`⚙️ Fuel monitoring will run every ${hours} hour(s)`);
    }

    // Schedule the cron job
    cron.schedule(cronExpression, async () => {
        console.log('\n🔔 Cron job triggered - Running fuel monitoring check...');

        try {
            await fuelMonitoringService.checkFuelLevels();
        } catch (error) {
            console.error('❌ Cron job error:', error);
        }
    }, {
        timezone: "America/New_York" // Match the site timezone
    });

    console.log('✅ Fuel monitoring cron job started successfully');
    console.log(`📅 Cron expression: ${cronExpression}`);
    console.log(`⏱️ Check interval: ${intervalHours} hour(s)`);

    // Run an initial check on startup (optional, after a short delay)
    setTimeout(async () => {
        console.log('\n🚀 Running initial fuel check on startup...');
        try {
            await fuelMonitoringService.checkFuelLevels();
        } catch (error) {
            console.error('❌ Initial fuel check error:', error);
        }
    }, 10000); // Wait 10 seconds after startup
};

/**
 * Stop fuel monitoring (for graceful shutdown)
 */
export const stopFuelMonitoring = (): void => {
    cron.getTasks().forEach((task: any) => task.stop());
    console.log('🛑 Fuel monitoring cron job stopped');
};
