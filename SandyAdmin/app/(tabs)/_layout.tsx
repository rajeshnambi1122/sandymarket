import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background.DEFAULT} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary.DEFAULT,
          tabBarInactiveTintColor: theme.colors.text.secondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface.DEFAULT,
            borderTopColor: theme.colors.border.DEFAULT,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
            shadowColor: theme.colors.text.DEFAULT,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 0,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary.DEFAULT,
            shadowColor: theme.colors.text.DEFAULT,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
          headerTintColor: theme.colors.text.inverse,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
          },
          headerShown: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            headerTitle: 'Sandy\'s Dashboard',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="dashboard" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            headerTitle: 'Order Management',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="cog" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}