import { User } from '../models/User';
import { firebaseAdmin } from '../config/firebase';
import { PriceComparison } from './gasBuddyService';

// @ts-ignore
import fetch from 'node-fetch';

// Initialize Firebase Admin
if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const sendNotification = async (
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    // Get all admin users with FCM tokens (including admin1 role)
    const adminUsers = await User.find({
      role: { $in: ['admin', 'admin1'] },
      fcmToken: { $exists: true, $ne: null }
    }); // Removed .lean() here if not strictly necessary, to match suggested code structure

    if (adminUsers.length === 0) {
      console.log('No admin users with FCM tokens found');
      return;
    }

    const fcmTokens = adminUsers
      .map(user => user.fcmToken)
      .filter((token): token is string => typeof token === 'string' && !!token);

    if (fcmTokens.length === 0) {
      console.log('No valid FCM tokens found');
      return;
    }

    console.log(`📱 Sending push notifications to ${fcmTokens.length} admin user(s)...`);

    const failedTokens: string[] = [];
    const failedUsers: Array<{ name: string, token: string }> = [];
    const successfulUsers: Array<{ name: string, token: string }> = [];

    for (let i = 0; i < fcmTokens.length; i++) {
      const token = fcmTokens[i];
      const user = adminUsers.find(u => u.fcmToken === token);

      const message = {
        token,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          // Add click_action for Android, sound for iOS if needed in data payload for some clients
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'default',
            priority: 'high' as const,
            sound: 'default',
            // vibrateTimingsMillis: [0, 250, 250, 250], // Optional
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      try {
        await firebaseAdmin.messaging().send(message);
        if (user) {
          successfulUsers.push({ name: user.name, token });
        }
      } catch (err: any) {
        console.error(`Failed to send to ${user?.name || 'Unknown User'} (${token.substring(0, 20)}...):`, err.message);
        failedTokens.push(token);
        if (user) {
          failedUsers.push({ name: user.name, token });
        }
        // Optional: Log specific Firebase errors for debugging
        if (err.errorInfo) {
          console.error('Firebase Error Info:', err.errorInfo);
        }
      }
    }

    // Log notification results summary
    const successCount = fcmTokens.length - failedTokens.length;
    if (successCount > 0) {
      console.log(`✅ Push notifications sent to ${successCount}/${fcmTokens.length} device(s)`);
    }

    if (failedTokens.length > 0) {
      console.log(`❌ ${failedTokens.length} notification(s) failed - cleaning up invalid tokens`);

      // Log failed notifications with user details
      if (failedUsers.length > 0) {
        console.log('❌ FAILED NOTIFICATIONS:');
        failedUsers.forEach((user, index) => {
          const truncatedToken = `${user.token.substring(0, 20)}...${user.token.substring(user.token.length - 8)}`;
          console.log(`  ${index + 1}. ✗ ${user.name} | FCM Token: ${truncatedToken}`);
        });
      }

      await User.updateMany(
        { fcmToken: { $in: failedTokens } },
        { $unset: { fcmToken: 1 } }
      );
      console.log('Removed invalid FCM tokens from database.');
    }

  } catch (error: any) {
    console.error('Error in sendNotification function:', error);
  }
};

export const sendNewOrderNotification = async (orderId: string, customerName: string) => {
  // Ensure data object values are strings for FCM payload
  const notificationData: Record<string, string> = {
    type: 'new_order',
    orderId: orderId.toString(), // Ensure it's a string
    customerName: customerName || 'Guest', // Ensure it's a string
    timestamp: new Date().toISOString(),
  };

  await sendNotification(
    'New Order Received',
    `New order #${orderId} from ${customerName || 'Guest'}`,
    notificationData
  );
};

export const sendFuelAlertNotification = async (lowFuelTanks: any[]) => {
  const tankLines = lowFuelTanks.map(alert =>
    `${alert.tank.productLabel} (Tank ${alert.tank.tankNumber}): ${alert.tank.volumeGallons.toFixed(0)} gal`
  ).join('\n');

  // Get admin1 users only
  const admin1Users = await User.find({
    role: 'admin1',
    fcmToken: { $exists: true, $ne: null }
  });

  if (admin1Users.length === 0) {
    console.log('No admin1 users with FCM tokens found');
    return;
  }

  const userNames = admin1Users.map(u => u.name).join(', ');
  console.log(`📱 Sending fuel alert to ${admin1Users.length} admin1 user(s): ${userNames}`);

  const title = '⛽ Fuel Level Alert';
  const body = `${lowFuelTanks.length} tank(s) low:\n${tankLines}`;
  const data: Record<string, string> = {
    type: 'fuel',
    screen: 'fuel',
    isFuelAlert: 'true',
    tankCount: lowFuelTanks.length.toString(),
    timestamp: new Date().toISOString(),
  };

  let successCount = 0;
  for (const user of admin1Users) {
    const message = {
      token: user.fcmToken as string,
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      android: {
        priority: 'high' as const,
        notification: { channelId: 'default', priority: 'high' as const, sound: 'default' },
      },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    try {
      await firebaseAdmin.messaging().send(message);
      successCount++;
    } catch (err: any) {
      console.error(`Failed to send fuel alert to ${user.name}:`, err.message);
    }
  }

  if (successCount > 0) {
    console.log(`✅ Fuel alert push sent to ${successCount}/${admin1Users.length} admin1 device(s)`);
  }
};

export const sendFuelDeliveryNotification = async (deliveries: {
  tankNumber: number;
  productLabel: string;
  gallonsDelivered: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}[]): Promise<void> => {
  const admin1Users = await User.find({
    role: 'admin1',
    fcmToken: { $exists: true, $ne: null }
  });

  if (admin1Users.length === 0) {
    console.log('No admin1 users with FCM tokens found for delivery notification');
    return;
  }

  const totalGallons = deliveries.reduce((sum, d) => sum + d.gallonsDelivered, 0);
  const tankLines = deliveries
    .map(d => `${d.productLabel} Tank ${d.tankNumber}: ${d.gallonsDelivered.toLocaleString()} gal`)
    .join(', ');

  const title = '⛽ Fuel Delivery Detected';
  const body = deliveries.length === 1
    ? `${deliveries[0].productLabel} Tank ${deliveries[0].tankNumber}: ${deliveries[0].gallonsDelivered.toLocaleString()} gallons delivered`
    : `${deliveries.length} deliveries: ${totalGallons.toLocaleString()} gal total — ${tankLines}`;

  const data: Record<string, string> = {
    type: 'fuel_delivery',
    screen: 'fuel',
    deliveryCount: deliveries.length.toString(),
    totalGallons: totalGallons.toString(),
    timestamp: new Date().toISOString(),
  };

  let successCount = 0;
  for (const user of admin1Users) {
    const message = {
      token: user.fcmToken as string,
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      android: {
        priority: 'high' as const,
        notification: { channelId: 'default', priority: 'high' as const, sound: 'default' },
      },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    try {
      await firebaseAdmin.messaging().send(message);
      successCount++;
      console.log(`📱 Fuel delivery push sent to ${user.name}`);
    } catch (err: any) {
      console.error(`Failed to send delivery push to ${user.name}:`, err.message);
    }
  }

  if (successCount > 0) {
    console.log(`✅ Fuel delivery push sent to ${successCount}/${admin1Users.length} admin1 device(s)`);
  }
};

/**
 * Send Gas Buddy price comparison push notification to admin1 users
 */
export const sendGasBuddyPriceNotification = async (comparison: PriceComparison): Promise<void> => {
  console.log('📱 Preparing Gas Buddy price push notification...');

  const admin1Users = await User.find({
    role: 'admin1',
    fcmToken: { $exists: true, $ne: null }
  });

  if (admin1Users.length === 0) {
    console.log('No admin1 users with FCM tokens found for Gas Buddy price notification');
    return;
  }

  const formatPrice = (price: number | null) => price ? `$${price.toFixed(2)}` : 'N/A';

  const title = '⛽ Daily GasBuddy Price Update';
  const body = `Sandy's: Reg ${formatPrice(comparison.sandy.regular)}, Mid ${formatPrice(comparison.sandy.midgrade)}, Diesel ${formatPrice(comparison.sandy.diesel)} | Big R: Reg ${formatPrice(comparison.bigR.regular)}, Mid ${formatPrice(comparison.bigR.midgrade)}, Diesel ${formatPrice(comparison.bigR.diesel)}`;

  const data: Record<string, string> = {
    type: 'gas_buddy_price',
    screen: 'fuel',
    sandyRegular: comparison.sandy.regular?.toString() || '',
    sandyMidgrade: comparison.sandy.midgrade?.toString() || '',
    sandyPremium: comparison.sandy.premium?.toString() || '',
    sandyDiesel: comparison.sandy.diesel?.toString() || '',
    bigRRegular: comparison.bigR.regular?.toString() || '',
    bigRMidgrade: comparison.bigR.midgrade?.toString() || '',
    bigRPremium: comparison.bigR.premium?.toString() || '',
    bigRDiesel: comparison.bigR.diesel?.toString() || '',
    timestamp: comparison.timestamp,
  };

  let successCount = 0;
  for (const user of admin1Users) {
    const message = {
      token: user.fcmToken as string,
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      android: {
        priority: 'high' as const,
        notification: { channelId: 'default', priority: 'high' as const, sound: 'default' },
      },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    try {
      await firebaseAdmin.messaging().send(message);
      successCount++;
      console.log(`📱 Gas Buddy price push sent to ${user.name}`);
    } catch (err: any) {
      console.error(`Failed to send Gas Buddy price push to ${user.name}:`, err.message);
    }
  }

  if (successCount > 0) {
    console.log(`✅ Gas Buddy price push sent to ${successCount}/${admin1Users.length} admin1 device(s)`);
  }
};

