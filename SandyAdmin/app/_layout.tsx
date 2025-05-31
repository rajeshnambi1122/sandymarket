import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingSpinner from '../components/LoadingSpinner';
import { View } from 'react-native';
import { theme } from '../constants/theme';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { setupNotificationListeners, requestNotificationPermission } from '../services/notifications';
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

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const [loaded] = useFonts({
    // ... your fonts
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      console.log('Navigation check:', { isAuthenticated, segments, isLoading });
      const inAuthGroup = segments[0] === 'login';
      
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated and not already there
        console.log('Redirecting to /login');
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to tabs if authenticated and on login screen
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

  useEffect(() => {
    // Initialize Firebase and request notification permissions
    requestNotificationPermission();
    setupNotificationListeners();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (token: string) => {
    try {
      await AsyncStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
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
