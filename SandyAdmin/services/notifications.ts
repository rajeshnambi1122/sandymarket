import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { adminAPI } from './api';
import { router } from 'expo-router';
import Constants from 'expo-constants';

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
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    // Request notification permission
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

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.owner || 'sandymarket-4e8e9'
    });
    
    console.log('Expo Push Token:', token.data);

    // Store the token
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token.data);

    // Send token to backend
    try {
      await adminAPI.updateFCMToken(token.data);
      console.log('Token sent to backend successfully');
    } catch (error) {
      console.error('Error sending token to backend:', error);
    }

    return token.data;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
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

export const getPushToken = async () => {
  try {
    return await AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}; 