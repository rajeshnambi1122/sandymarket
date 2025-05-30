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
const EXPO_PROJECT_ID = 'sandymarket-4e8e9'; // Your Expo project ID

export const sendNewOrderNotification = async (order: Document) => {
  try {
    console.log('Starting to send new order notification...');
    
    // Get all admin FCM tokens from the database
    const User = firebaseAdmin.firestore().collection('users');
    console.log('Querying Firestore for admin users...');
    
    const adminUsers = await User.where('role', '==', 'admin').get();
    console.log(`Found ${adminUsers.size} admin users`);
    
    const adminTokens = adminUsers.docs
      .map((doc) => {
        const data = doc.data() as UserData;
        console.log(`Admin user ${doc.id}:`, {
          hasToken: !!data.fcmToken,
          role: data.role
        });
        return data.fcmToken;
      })
      .filter((token): token is string => !!token);

    console.log(`Found ${adminTokens.length} valid admin tokens`);

    if (adminTokens.length === 0) {
      console.log('No admin push tokens found');
      return;
    }

    const orderData = order.toObject();
    console.log('Sending notification for order:', {
      id: orderData._id,
      customerName: orderData.customerName
    });

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
      _displayInForeground: true,
    }));

    // Send notifications using Expo's push service
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    console.log(`Sending ${chunks.length} chunks of notifications...`);

    for (const chunk of chunks) {
      try {
        const response = await axios.post(EXPO_PUSH_ENDPOINT, chunk);
        console.log('Push notification response:', response.data);
      } catch (error) {
        console.error('Error sending chunk of notifications:', error);
      }
    }

    console.log('Notification sending completed');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}; 