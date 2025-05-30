import { firebaseAdmin } from '../config/firebase';
import { Order } from '../models/Order';
import { DocumentData } from 'firebase-admin/firestore';
import { Document } from 'mongoose';
import type { Messaging } from 'firebase-admin/messaging';

interface UserData extends DocumentData {
  fcmToken?: string;
  role?: string;
}

export const sendNewOrderNotification = async (order: Document) => {
  try {
    // Get all admin FCM tokens from the database
    const User = firebaseAdmin.firestore().collection('users');
    const adminUsers = await User.where('role', '==', 'admin').get();
    
    const adminTokens = adminUsers.docs
      .map((doc) => (doc.data() as UserData).fcmToken)
      .filter((token): token is string => !!token); // Filter out null/undefined tokens

    if (adminTokens.length === 0) {
      console.log('No admin FCM tokens found');
      return;
    }

    const orderData = order.toObject();

    // Create notification message
    const message = {
      notification: {
        title: 'New Order Received',
        body: `Order #${orderData._id} from ${orderData.customerName}`,
      },
      data: {
        orderId: orderData._id.toString(),
        type: 'new_order',
        customerName: orderData.customerName,
        totalAmount: orderData.totalAmount.toString(),
      },
      tokens: adminTokens,
    };

    // Send notification
    const response = await firebaseAdmin.messaging().sendMulticast(message);
    console.log('Notification sent:', response);
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx: number) => {
        if (!resp.success) {
          failedTokens.push(adminTokens[idx]);
        }
      });
      console.log('Failed to send notifications to tokens:', failedTokens);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
}; 