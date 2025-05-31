import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { adminAPI } from './api';
import { router } from 'expo-router';
import messaging from '@react-native-firebase/messaging';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export const requestNotificationPermission = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications are not supported on this device/emulator.');
      // Optionally return a null token or handle accordingly
      return null; 
    }

    // Request notification permission using firebase/messaging
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Failed to get push notification permission!');
      return null;
    }

    // Get FCM token using firebase/messaging
    const token = await messaging().getToken();
    
    console.log('Native FCM Token:', token);

    if (token) {
      // Send token to backend
      try {
        await adminAPI.updateFCMToken(token);
        console.log('FCM Token sent to backend successfully');
        return token;
      } catch (error) {
        console.error('Error sending FCM token to backend:', error);
        return null;
      }
    } else {
      console.log('FCM token not available.');
      return null;
    }

  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const setupNotificationListeners = () => {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Received notification in foreground:', notification);
    // Show a local notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      },
      trigger: null,
    });
  });

  // Handle notification when app is in background and user taps it
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    const data = response.notification.request.content.data;
    
    // If it's a new order notification, navigate to the orders tab
    if (data?.type === 'new_order') {
      router.push('/(tabs)/orders');
    }
  });

  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
}; 