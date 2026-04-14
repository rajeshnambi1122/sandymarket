import cron from 'node-cron';
import { fuelMonitoringService } from '../services/fuelMonitoringService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Start the fuel monitoring cron job
 * Sends tank status reports at 7:00 AM and 7:00 PM Detroit time
 */
export const startFuelMonitoring = (): void => {
    const cronExpression = '0 7,19 * * *';
    console.log('Fuel tank status reports will run daily at 7:00 AM and 7:00 PM Detroit time');

    // Schedule the cron job
    cron.schedule(cronExpression, async () => {
        console.log('\nCron job triggered - Sending scheduled tank status report...');

        try {
            await fuelMonitoringService.checkFuelLevels();
        } catch (error) {
            console.error('❌ Cron job error:', error);
        }
    }, {
        timezone: "America/Detroit"
    });

    console.log('✅ Fuel monitoring cron job started successfully');
    console.log(`📅 Cron expression: ${cronExpression}`);
    console.log('Timezone: America/Detroit');
};

/**
 * Stop fuel monitoring (for graceful shutdown)
 */
export const stopFuelMonitoring = (): void => {
    cron.getTasks().forEach((task: any) => task.stop());
    console.log('🛑 Fuel monitoring cron job stopped');
};
