import { firebaseAdmin } from '../config/firebase';
import { Order } from '../models/Order';
import { DocumentData } from 'firebase-admin/firestore';
import { Document } from 'mongoose';
import axios from 'axios';

interface UserData extends DocumentData {
  fcmToken?: string;
  role?: string;
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export const sendNewOrderNotification = async (order: Document) => {
  try {
    // Get all admin FCM tokens from the database
    const User = firebaseAdmin.firestore().collection('users');
    const adminUsers = await User.where('role', '==', 'admin').get();
    
    const adminTokens = adminUsers.docs
      .map((doc) => (doc.data() as UserData).fcmToken)
      .filter((token): token is string => !!token); // Filter out null/undefined tokens

    if (adminTokens.length === 0) {
      console.log('No admin push tokens found');
      return;
    }

    const orderData = order.toObject();

    // Create notification message
    const messages = adminTokens.map(token => ({
      to: token,
      sound: 'default',
      title: 'New Order Received',
      body: `Order #${orderData._id} from ${orderData.customerName}`,
      data: {
        orderId: orderData._id.toString(),
        type: 'new_order',
        customerName: orderData.customerName,
        totalAmount: orderData.totalAmount.toString(),
      },
    }));

    // Send notifications using Expo's push service
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await axios.post(EXPO_PUSH_ENDPOINT, chunk);
      console.log('Push notification response:', response.data);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
}; 