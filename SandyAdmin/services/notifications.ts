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
  // Handle FCM messages when app is in foreground
  const onMessageListener = messaging().onMessage(async remoteMessage => {
    console.log('FCM Message received in foreground:', remoteMessage);
    // Display a local notification using expo-notifications
    // (since the Expo handler is configured to show alerts)
    Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data, // Pass data payload
      },
      trigger: null,
    });
  });

  // Handle FCM messages when app is in background or quit state
  // This requires a headless task for Android in index.js or App.js
  // For simplicity here, we'll just add the listener part.
  // The actual background handling needs setup outside this file.
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('FCM Message handled in the background!', remoteMessage);
    // You can perform background tasks here, e.g., update local data
    // For navigation on background tap, you need a different listener/approach.
  });

  // Handle notification tap when app is in background or quit state
  // This listener fires when the user taps on the system notification
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      'FCM notification caused app to open from background state:',
      remoteMessage,
    );
    const data = remoteMessage.data;
    // Navigate based on data, e.g., to the orders tab
    if (data?.type === 'new_order') {
      // Use a timeout to ensure navigation state is ready, if needed
      setTimeout(() => {
         router.push('/(tabs)/orders');
      }, 500); // Adjust timeout if necessary
    }
  });

  // Handle notification tap when app was opened from a quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'FCM notification caused app to open from quit state:',
          remoteMessage,
        );
        const data = remoteMessage.data;
        // Navigate based on data, e.g., to the orders tab
        if (data?.type === 'new_order') {
          setTimeout(() => {
             router.push('/(tabs)/orders');
          }, 500); // Adjust timeout if necessary
        }
      }
    });

  // Return unsubscribe functions for foreground listener
  return onMessageListener; // Only onMessage returns an unsubscribe function directly
}; 