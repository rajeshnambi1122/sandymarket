import cron from 'node-cron';
import { gasBuddyService } from '../services/gasBuddyService';
import { sendGasBuddyPriceEmail } from '../services/resendEmailService';
import { sendGasBuddyPriceSms } from '../services/smsService';
import { sendGasBuddyPriceNotification } from '../services/notificationService';

/**
 * Start the Gas Buddy price comparison cron job
 * Sends daily price comparison alert at 8:15 AM Detroit time
 * Includes Email, SMS, and Push Notification to admin1 and FUEL_ALERT_PHONE
 */
export const startGasBuddyPriceJob = (): void => {
    // Schedule for 8:15 AM Detroit time (America/Detroit timezone)
    // Cron format: minute hour * * *
    const cronExpression = '15 8 * * *';

    console.log('⚙️ Gas Buddy price job will run daily at 8:15 AM Detroit time');

    cron.schedule(cronExpression, async () => {
        console.log('\n💰 ========== GAS BUDDY PRICE JOB STARTED ==========');
        console.log(`⏰ Job triggered at: ${new Date().toLocaleString('en-US', { timeZone: 'America/Detroit' })}`);

        try {
            // Fetch current prices from both stations
            const comparison = await gasBuddyService.comparePrices();

            console.log('\n📊 Price Comparison Results:');
            console.log(`   Sandy's Market:`);
            console.log(`     - Regular: ${comparison.sandy.regular ? '$' + comparison.sandy.regular.toFixed(2) : 'N/A'}`);
            console.log(`     - Premium: ${comparison.sandy.premium ? '$' + comparison.sandy.premium.toFixed(2) : 'N/A'}`);
            console.log(`     - Diesel: ${comparison.sandy.diesel ? '$' + comparison.sandy.diesel.toFixed(2) : 'N/A'}`);
            console.log(`   Big R's Pump & Party:`);
            console.log(`     - Regular: ${comparison.bigR.regular ? '$' + comparison.bigR.regular.toFixed(2) : 'N/A'}`);
            console.log(`     - Premium: ${comparison.bigR.premium ? '$' + comparison.bigR.premium.toFixed(2) : 'N/A'}`);
            console.log(`     - Diesel: ${comparison.bigR.diesel ? '$' + comparison.bigR.diesel.toFixed(2) : 'N/A'}`);

            // Send notifications in parallel (non-blocking)
            console.log('\n📤 Sending notifications...');

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

            console.log('✅ ========== GAS BUDDY PRICE JOB COMPLETED ==========\n');
        } catch (error: any) {
            console.error('❌ Gas Buddy price job error:', error.message);
            console.error('Stack:', error.stack);
        }
    }, {
        timezone: 'America/Detroit'
    });

    console.log('✅ Gas Buddy price job started successfully');
    console.log(`📅 Cron expression: ${cronExpression} (8:15 AM Detroit time)`);
    console.log(`🌍 Timezone: America/Detroit (Eastern Time)`);
};

/**
 * Stop Gas Buddy price job (for graceful shutdown)
 */
export const stopGasBuddyPriceJob = (): void => {
    cron.getTasks().forEach((task: any) => task.stop());
    console.log('🛑 Gas Buddy price job stopped');
};
