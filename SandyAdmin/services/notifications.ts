import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FCM_TOKEN_KEY = '@fcm_token';

export const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      await getFCMToken();
    }
  } catch (error) {
    console.error('Permission request error:', error);
  }
};

export const getFCMToken = async () => {
  try {
    const fcmToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

    if (!fcmToken) {
      const token = await messaging().getToken();
      if (token) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        // TODO: Send token to backend
        console.log('New FCM Token:', token);
      }
    } else {
      console.log('Existing FCM Token:', fcmToken);
    }
  } catch (error) {
    console.error('FCM Token error:', error);
  }
};

export const setupNotificationListeners = () => {
  // Handle notification when app is in foreground
  messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Received foreground message:', remoteMessage);
    // TODO: Show local notification
  });

  // Handle notification when app is in background
  messaging().setBackgroundMessageHandler(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Received background message:', remoteMessage);
  });

  // Handle notification open
  messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Notification opened app:', remoteMessage);
    // TODO: Navigate to order details
  });

  // Check if app was opened from a notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
      if (remoteMessage) {
        console.log('App opened from quit state:', remoteMessage);
        // TODO: Navigate to order details
      }
    });
}; 