import admin from 'firebase-admin';
import { User } from '../models/User';
import { MulticastMessage } from 'firebase-admin/messaging';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
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
      tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
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