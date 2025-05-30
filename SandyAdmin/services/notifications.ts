import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { adminAPI } from './api';

const EXPO_PUSH_TOKEN_KEY = 'expoPushToken';

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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Store the token
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);

    // Send token to backend
    try {
      await adminAPI.updateFCMToken(token);
      console.log('Token sent to backend successfully');
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }

    return token;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

export const setupNotificationListeners = () => {
  // Handle notification when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Received notification in foreground:', notification);
  });

  // Handle notification when app is in background and user taps it
  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
  });

  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
};

export const getPushToken = async () => {
  try {
    return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}; 