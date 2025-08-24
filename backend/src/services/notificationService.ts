import { User } from '../models/User';
import { firebaseAdmin } from '../config/firebase';

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

    console.log(`📱 SENDING NOTIFICATIONS: Attempting to send to ${fcmTokens.length} device(s)`);
    
    // Log detailed information about recipients
    console.log('📋 NOTIFICATION RECIPIENTS:');
    adminUsers.forEach((user, index) => {
      if (user.fcmToken) {
        const truncatedToken = `${user.fcmToken.substring(0, 20)}...${user.fcmToken.substring(user.fcmToken.length - 8)}`;
        console.log(`  ${index + 1}. User: ${user.name} | FCM Token: ${truncatedToken}`);
      }
    });

    const failedTokens: string[] = [];
    const failedUsers: Array<{name: string, token: string}> = [];
    const successfulUsers: Array<{name: string, token: string}> = [];

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
          successfulUsers.push({name: user.name, token});
        }
      } catch (err: any) {
        console.error(`Failed to send to ${user?.name || 'Unknown User'} (${token.substring(0, 20)}...):`, err.message);
        failedTokens.push(token);
        if (user) {
          failedUsers.push({name: user.name, token});
        }
        // Optional: Log specific Firebase errors for debugging
        if (err.errorInfo) {
            console.error('Firebase Error Info:', err.errorInfo);
        }
      }
    }

    // Log notification results summary
    const successCount = fcmTokens.length - failedTokens.length;
    console.log(`✅ NOTIFICATION RESULTS: ${successCount}/${fcmTokens.length} devices received notification successfully`);
    
    // Log successful notifications with user details
    if (successfulUsers.length > 0) {
      console.log('✅ SUCCESSFUL NOTIFICATIONS:');
      successfulUsers.forEach((user, index) => {
        const truncatedToken = `${user.token.substring(0, 20)}...${user.token.substring(user.token.length - 8)}`;
        console.log(`  ${index + 1}. ✓ ${user.name} | FCM Token: ${truncatedToken}`);
      });
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