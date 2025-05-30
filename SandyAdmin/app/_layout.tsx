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

SplashScreen.preventAutoHideAsync();

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

  return <Stack />;
}
