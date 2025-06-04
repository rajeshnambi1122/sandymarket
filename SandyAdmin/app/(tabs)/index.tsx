import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Image, ActivityIndicator } from 'react-native';
import { ordersAPI } from '../../services/api';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import messaging from '@react-native-firebase/messaging';
import { adminAPI } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types/order';
import { AuthContext } from '../_layout';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const fetchStats = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      if (response.success) {
        const orders = response.data as Order[];
        const today = new Date().toISOString().split('T')[0];
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const todayRevenue = orders
          .filter(order => order.createdAt.split('T')[0] === today)
          .reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        setStats({
          totalOrders: orders.length,
          todayOrders: orders.filter(order => order.createdAt.split('T')[0] === today).length,
          pendingOrders: orders.filter(order => order.status === 'pending').length,
          processingOrders: orders.filter(order => order.status === 'preparing').length,
          completedOrders: orders.filter(order => order.status === 'ready').length,
          totalRevenue,
          todayRevenue,
          averageOrderValue,
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
      backgroundColor: theme.colors.background.DEFAULT,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    logo: {
      width: 40,
      height: 40,
      marginRight: theme.spacing.md,
      borderRadius: 8,
    },
    welcomeSection: {
      marginBottom: theme.spacing.xs,
    },
    welcomeText: {
      ...theme.typography.h1,
      color: theme.colors.text.DEFAULT,
      marginBottom: theme.spacing.sm,
    },
    subtitleText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.lg,
    },
    statsContainer: {
      gap: theme.spacing.md,
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    statCard: {
      flex: 1,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface.DEFAULT,
      shadowColor: theme.colors.text.DEFAULT,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    primaryStatCard: {
      backgroundColor: theme.colors.primary.DEFAULT,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryStatIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statValue: {
      ...theme.typography.h2,
      color: theme.colors.text.DEFAULT,
      fontWeight: '700',
      marginBottom: theme.spacing.xs,
    },
    primaryStatValue: {
      color: theme.colors.text.inverse,
    },
    statLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    primaryStatLabel: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    fullWidthCard: {
      marginTop: theme.spacing.md,
    },
    revenueStatCard: {
      backgroundColor: theme.colors.success,
    },
    revenueStatIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    revenueStatValue: {
      color: theme.colors.text.inverse,
    },
    revenueStatLabel: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.DEFAULT }]}>
        <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
      </View>
    );
  }

  const StatCard = ({ 
    icon, 
    value, 
    label, 
    isPrimary = false, 
    isRevenue = false, 
    style = {} 
  }: {
    icon: string;
    value: number | string;
    label: string;
    isPrimary?: boolean;
    isRevenue?: boolean;
    style?: any;
  }) => (
    <View style={[styles.statCard, isPrimary && styles.primaryStatCard, style]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, isPrimary && styles.primaryStatIcon]}>
          <Ionicons 
            name={icon as any} 
            size={24} 
            color={isPrimary ? theme.colors.text.inverse : theme.colors.primary.DEFAULT} 
          />
        </View>
      </View>
      <Text style={[styles.statValue, isPrimary && styles.primaryStatValue]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, isPrimary && styles.primaryStatLabel]}>
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background.DEFAULT }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary.DEFAULT]}
          tintColor={theme.colors.primary.DEFAULT}
        />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.welcomeText, { color: theme.colors.text.DEFAULT }]}>
          Welcome back, {user?.name || 'Admin'}!
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="cash"
          value={formatCurrency(stats?.totalRevenue || 0)}
          label="Total Revenue"
          isRevenue
        />
        
        <View style={styles.statsRow}>
          <StatCard
            icon="receipt"
            value={stats?.totalOrders || 0}
            label="Total Orders"
            isPrimary
          />
          <StatCard
            icon="today"
            value={formatCurrency(stats?.todayRevenue || 0)}
            label="Today's Revenue"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="time"
            value={stats?.pendingOrders || 0}
            label="Pending"
          />
          <StatCard
            icon="restaurant"
            value={stats?.processingOrders || 0}
            label="Processing"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle"
            value={stats?.completedOrders || 0}
            label="Completed"
          />
        </View>

        <StatCard
          icon="trending-up"
          value={formatCurrency(stats?.averageOrderValue || 0)}
          label="Average Order Value"
          style={styles.fullWidthCard}
        />
      </View>
    </ScrollView>
  );
}