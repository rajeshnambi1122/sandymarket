import { User } from '../models/User';
import { firebaseAdmin } from '../config/firebase';
import { MulticastMessage } from 'firebase-admin/messaging';
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
  data: any = {}
) => {
  try {
    // Get all admin users with FCM tokens
    const adminUsers = await User.find({ 
      role: 'admin',
      fcmToken: { $exists: true, $ne: null }
    }).lean();

    if (adminUsers.length === 0) {
      console.log('No admin users with FCM tokens found');
      return;
    }

    const tokens = adminUsers
      .map(user => user.fcmToken)
      .filter((token): token is string => typeof token === 'string');

    if (tokens.length === 0) {
      console.log('No valid FCM tokens found');
      return;
    }

    // Separate Expo and FCM tokens
    const expoTokens = tokens.filter(token => token.startsWith('ExponentPushToken'));
    const fcmTokens = tokens.filter(token => !token.startsWith('ExponentPushToken'));

    // Send to Expo tokens
    if (expoTokens.length > 0) {
      const expoMessages = expoTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expoMessages),
      });
      const result = await response.json();
      console.log('Expo notification result:', result);
    }

    // Send to FCM tokens via Firebase Admin
    if (fcmTokens.length > 0) {
      console.log(`Attempting to send to ${fcmTokens.length} FCM token(s):`, fcmTokens);
      const message: MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'default',
            priority: 'high' as const,
            sound: 'default',
            vibrateTimingsMillis: [0, 250, 250, 250],
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
        tokens: fcmTokens,
      };

      const response = await firebaseAdmin.messaging().sendMulticast(message);
      console.log('FCM notification sent:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(fcmTokens[idx]);
          }
        });

        // Remove invalid tokens from users
        if (failedTokens.length > 0) {
          await User.updateMany(
            { fcmToken: { $in: failedTokens } },
            { $unset: { fcmToken: 1 } }
          );
          console.log('Removed invalid FCM tokens:', failedTokens);
        }
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendNewOrderNotification = async (orderId: string, customerName: string) => {
  await sendNotification(
    'New Order Received',
    `New order #${orderId} from ${customerName}`,
    {
      type: 'new_order',
      orderId,
      customerName,
      timestamp: new Date().toISOString(),
    }
  );
}; 