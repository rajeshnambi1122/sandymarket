import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { theme } from '../../constants/theme';
import { ordersAPI } from '../../services/api';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import messaging from '@react-native-firebase/messaging';
import { adminAPI } from '../../services/api';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveredOrders: number;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    deliveredOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      if (response.success) {
        const orders = response.data;
        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((order: any) => order.status === 'pending').length,
          preparingOrders: orders.filter((order: any) => order.status === 'preparing').length,
          readyOrders: orders.filter((order: any) => order.status === 'ready').length,
          deliveredOrders: orders.filter((order: any) => order.status === 'delivered').length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Request permission
    messaging().requestPermission()
      .then(authStatus => {
        if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
          // Get the device token
          messaging().getToken().then(async token => {
            console.log('FCM Token:', token);
            // Send this token to your backend!
            if (token) {
              try {
                await adminAPI.updateFCMToken(token);
                console.log('FCM Token sent to backend successfully');
              } catch (error) {
                console.error('Error sending FCM token to backend:', error);
              }
            }
          });
        }
      });

    // Listen for foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingOrders}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.preparingOrders}</Text>
          <Text style={styles.statLabel}>Preparing Orders</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.readyOrders}</Text>
          <Text style={styles.statLabel}>Ready Orders</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{stats.deliveredOrders}</Text>
          <Text style={styles.statLabel}>Delivered Orders</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.DEFAULT,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.DEFAULT,
    marginBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary.DEFAULT,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.body,
    color: theme.colors.text.DEFAULT,
    textAlign: 'center',
  },
});
