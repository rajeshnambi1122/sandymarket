import { Expo } from 'expo-server-sdk';
import { Admin } from '../models/Admin';

const expo = new Expo();

interface NotificationData {
  type: string;
  orderId: string;
  [key: string]: any;
}

export const sendNotification = async (title: string, body: string, data: NotificationData = { type: '', orderId: '' }) => {
  try {
    // Get all admin users
    const admins = await Admin.find({ fcmToken: { $exists: true, $ne: null } });
    
    if (!admins.length) {
      console.log('No admin users found with FCM tokens');
      return;
    }

    // Create the notification message
    const message = {
      to: admins.map((admin: { fcmToken: string }) => admin.fcmToken),
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    };

    // Send the notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notification chunk:', error);
      }
    }

    // Log the results
    console.log('Notification tickets:', tickets);

    // Check for errors
    const errors = tickets.filter(ticket => ticket.status === 'error');
    if (errors.length > 0) {
      console.error('Some notifications failed to send:', errors);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendNewOrderNotification = async (orderId: string, customerName: string) => {
  await sendNotification(
    'New Order Received',
    `New order from ${customerName}`,
    {
      type: 'new_order',
      orderId,
    }
  );
}; 