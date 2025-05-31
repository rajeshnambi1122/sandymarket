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
    // Get all admin users with FCM tokens
    const adminUsers = await User.find({ 
      role: 'admin',
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

    console.log(`Attempting to send to ${fcmTokens.length} FCM token(s) individually:`, fcmTokens);

    const failedTokens: string[] = [];

    for (const token of fcmTokens) {
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
        const response = await firebaseAdmin.messaging().send(message);
        console.log(`Notification sent successfully to token: ${token}`, response);
      } catch (err: any) {
        console.error(`Failed to send to token ${token}:`, err.message);
        failedTokens.push(token);
        // Optional: Log specific Firebase errors for debugging
        if (err.errorInfo) {
            console.error('Firebase Error Info:', err.errorInfo);
        }
      }
    }

    if (failedTokens.length > 0) {
      console.log('Cleaning up failed FCM tokens:', failedTokens);
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

// Removed Expo related send logic as it's for different token type and not needed for admin push

// Removed getPushToken if it existed and was only for Expo token AsyncStorage 