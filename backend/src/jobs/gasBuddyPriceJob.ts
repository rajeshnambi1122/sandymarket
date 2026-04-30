import cron from 'node-cron';
import { gasBuddyService } from '../services/gasBuddyService';
import { sendGasBuddyPriceEmail } from '../services/resendEmailService';
import { sendGasBuddyPriceNotification } from '../services/notificationService';

/**
 * Start the Gas Buddy price comparison cron job
 * Sends price comparison alerts twice daily at 8:15 AM and 3:00 PM Detroit time
 * Includes email and push notification delivery only
 */
export const startGasBuddyPriceJob = (): void => {
    const morningCronExpression = '15 8 * * *';
    const afternoonCronExpression = '0 15 * * *';

    console.log('Gas Buddy price job will run twice daily at 8:15 AM and 3:00 PM Detroit time');

    const executeJob = async (timeOfDay: 'Morning' | 'Afternoon') => {
        console.log('\n========== GAS BUDDY PRICE JOB STARTED ==========');
        console.log(`Job triggered at: ${new Date().toLocaleString('en-US', { timeZone: 'America/Detroit' })}`);

        try {
            const comparison = await gasBuddyService.comparePrices();

            console.log('\nPrice Comparison Results:');
            console.log(`   Sandy's Market:`);
            console.log(`     - Regular: ${comparison.sandy.regular ? '$' + comparison.sandy.regular.toFixed(2) : 'N/A'}`);
            console.log(`     - Premium: ${comparison.sandy.premium ? '$' + comparison.sandy.premium.toFixed(2) : 'N/A'}`);
            console.log(`     - Diesel: ${comparison.sandy.diesel ? '$' + comparison.sandy.diesel.toFixed(2) : 'N/A'}`);
            console.log(`   Big R's Pump & Party:`);
            console.log(`     - Regular: ${comparison.bigR.regular ? '$' + comparison.bigR.regular.toFixed(2) : 'N/A'}`);
            console.log(`     - Premium: ${comparison.bigR.premium ? '$' + comparison.bigR.premium.toFixed(2) : 'N/A'}`);
            console.log(`     - Diesel: ${comparison.bigR.diesel ? '$' + comparison.bigR.diesel.toFixed(2) : 'N/A'}`);

            console.log('\nSending notifications...');

            const notifications = [
                sendGasBuddyPriceEmail(comparison, timeOfDay)
                    .then(() => console.log('Email sent successfully'))
                    .catch(err => console.error('Email failed:', err.message)),

                sendGasBuddyPriceNotification(comparison, timeOfDay)
                    .then(() => console.log('Push notification sent successfully'))
                    .catch(err => console.error('Push notification failed:', err.message)),
            ];

            await Promise.allSettled(notifications);

            console.log('========== GAS BUDDY PRICE JOB COMPLETED ==========\n');
        } catch (error: any) {
            console.error('Gas Buddy price job error:', error.message);
            console.error('Stack:', error.stack);
        }
    };

    cron.schedule(morningCronExpression, () => executeJob('Morning'), {
        timezone: 'America/Detroit'
    });

    cron.schedule(afternoonCronExpression, () => executeJob('Afternoon'), {
        timezone: 'America/Detroit'
    });

    console.log('Gas Buddy price job started successfully');
    console.log(`Morning cron: ${morningCronExpression} (8:15 AM Detroit time)`);
    console.log(`Afternoon cron: ${afternoonCronExpression} (3:00 PM Detroit time)`);
    console.log('Timezone: America/Detroit (Eastern Time)');
};

/**
 * Stop Gas Buddy price job (for graceful shutdown)
 */
export const stopGasBuddyPriceJob = (): void => {
    cron.getTasks().forEach((task: any) => task.stop());
    console.log('Gas Buddy price job stopped');
};
