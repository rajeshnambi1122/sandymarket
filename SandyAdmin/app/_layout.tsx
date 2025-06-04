import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingSpinner from '../components/LoadingSpinner';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { setupNotificationListeners, requestNotificationPermission } from '../services/notifications';
import messaging from '@react-native-firebase/messaging';
import '../config/firebase'; // Import Firebase config
import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTheme } from '../contexts/ThemeContext';
import { authAPI } from '../services/api';

SplashScreen.preventAutoHideAsync();

// Create a context to manage auth state
export const AuthContext = React.createContext<{
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}>({
  signIn: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  user: null,
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

function RootLayoutContent() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const [loadedFonts] = useFonts({
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

      // Load user data if token exists
      if (token) {
        const userDataStr = await AsyncStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
        } else {
          // If no user data in storage but token exists, fetch it
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
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
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!isAuthenticated && !inAuthGroup) {
        console.log('Redirecting to /(auth)/login');
        router.replace('/(auth)/login');
      } else if (isAuthenticated && inAuthGroup) {
        console.log('Redirecting to /(tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  useEffect(() => {
    if (loadedFonts) {
      SplashScreen.hideAsync();
    }
  }, [loadedFonts]);

  const signIn = async (token: string) => {
    try {
      console.log('Signing in with token:', token.substring(0, 20) + '...');
      await AsyncStorage.setItem('token', token);
      setIsAuthenticated(true);
      
      // Get user data
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
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
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.DEFAULT }}>
        <LoadingSpinner size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!loadedFonts) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
      <Stack>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="(auth)" 
            options={{ headerShown: false }} 
          />
        ) : (
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
        )}
      </Stack>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
