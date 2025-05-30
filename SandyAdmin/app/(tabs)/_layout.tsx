import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary.DEFAULT,
        tabBarInactiveTintColor: theme.colors.text.DEFAULT,
        tabBarStyle: {
          backgroundColor: theme.colors.white.DEFAULT,
          borderTopColor: theme.colors.border.DEFAULT,
        },
        headerStyle: {
          backgroundColor: theme.colors.white.DEFAULT,
        },
        headerTintColor: theme.colors.text.DEFAULT,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gas-prices"
        options={{
          title: 'Gas Prices',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="tachometer" size={24} color={color} />
          ),
        }}
      />
     
    </Tabs>
  );
}
