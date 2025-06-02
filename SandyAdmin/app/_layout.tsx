import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingSpinner from '../components/LoadingSpinner';
import { View } from 'react-native';
import { theme } from '../constants/theme';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { setupNotificationListeners, requestNotificationPermission } from '../services/notifications';
import messaging from '@react-native-firebase/messaging';
import '../config/firebase'; // Import Firebase config
import React from 'react';

SplashScreen.preventAutoHideAsync();

// Create a context to manage auth state
export const AuthContext = React.createContext<{
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}>({
  signIn: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
});

// Initialize Firebase Messaging
const initializeFirebaseMessaging = async () => {
  try {
    // Check if Firebase is initialized
    if (!messaging().app) {
      console.log('Firebase not initialized, waiting...');
      return;
    }

    // Request permission and setup notifications
    await requestNotificationPermission();
    
    // Setup notification listeners
    const unsubscribe = setupNotificationListeners();
    
    // Return cleanup function
    return () => {
      unsubscribe();
    };
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
  }
};

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const [loaded] = useFonts({
    // ... your fonts
  });

  useEffect(() => {
    // Initialize Firebase Messaging
    const cleanup = initializeFirebaseMessaging();
    return () => {
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Auth check - Token found:', !!token);
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log('Navigation check:', { isAuthenticated, segments, isLoading });
      const inAuthGroup = segments[0] === 'login';
      
      if (!isAuthenticated && !inAuthGroup) {
        console.log('Redirecting to /login');
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        console.log('Redirecting to /(tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const signIn = async (token: string) => {
    try {
      console.log('Signing in with token:', token.substring(0, 20) + '...');
      await AsyncStorage.setItem('token', token);
      setIsAuthenticated(true);
      
      // Request notification permissions after successful login
      console.log('Requesting notification permissions after login...');
      await requestNotificationPermission();
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingSpinner size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!loaded) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated }}>
      <Stack />
    </AuthContext.Provider>
  );
}
