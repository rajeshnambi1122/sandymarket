import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, AppState } from 'react-native';
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

// Track app state
let appState = AppState.currentState;

// Listen for app state changes
AppState.addEventListener('change', nextAppState => {
  appState = nextAppState;
});

// Configure notification channel for Android
const configureNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications are not supported on this device/emulator.');
      return null; 
    }

    // Configure notification channel first
    await configureNotificationChannel();

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

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  
  // Only schedule a local notification if the app is in background
  // When app is killed, FCM will handle showing the notification automatically
  if (remoteMessage.notification && appState === 'background') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        data: remoteMessage.data,
      },
      trigger: null,
    });
  }
});

export const setupNotificationListeners = () => {
  // Handle FCM messages when app is in foreground
  const onMessageListener = messaging().onMessage(async remoteMessage => {
    console.log('FCM Message received in foreground:', remoteMessage);
    
    // For foreground messages, we can show the notification directly
    if (remoteMessage.notification) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data: remoteMessage.data,
        },
        trigger: null,
      });
    }
  });

  // Handle notification tap when app is in background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app from background:', remoteMessage);
    handleNotificationNavigation(remoteMessage.data);
  });

  // Handle notification tap when app was opened from quit state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification opened app from quit state:', remoteMessage);
        handleNotificationNavigation(remoteMessage.data);
      }
    });

  return onMessageListener;
};

// Helper function to handle navigation based on notification data
const handleNotificationNavigation = (data: any) => {
  if (!data) return;

  // Add a small delay to ensure navigation state is ready
  setTimeout(() => {
    if (data.type === 'new_order') {
      router.push('/(tabs)/orders');
    }
    // Add more navigation cases as needed
  }, 500);
}; 