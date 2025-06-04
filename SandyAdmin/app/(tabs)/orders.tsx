import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { ordersAPI } from '../../services/api';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { Order, OrderItem } from '../../types/order';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export default function OrdersScreen() {
  const { theme, isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAllOrders();
      if (response.success) {
        const ordersData = response.data || [];
        const typedOrders = ordersData.map((order: any) => ({
          ...order,
          status: order.status as 'pending' | 'preparing' | 'ready' | 'delivered'
        }));
        
        // Check if there's a new order
        if (lastOrderId && typedOrders.length > 0) {
          const latestOrder = typedOrders[0];
          if (latestOrder._id.toString() !== lastOrderId) {
            // Show notification for new order
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Order Received',
                body: `Order #${latestOrder._id} from ${latestOrder.customerName}`,
                data: { orderId: latestOrder._id.toString() },
              },
              trigger: null,
            });
          }
        }
        
        setOrders(typedOrders);
        if (typedOrders.length > 0) {
          setLastOrderId(typedOrders[0]._id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: 'pending' | 'preparing' | 'ready' | 'delivered') => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId.toString(), newStatus);
      if (response.success) {
        // Update the order in the local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        Alert.alert('Error', 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return theme.colors.success;
      case 'ready':
        return theme.colors.info;
      case 'preparing':
        return theme.colors.warning;
      case 'pending':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'checkmark-circle';
      case 'ready':
        return 'checkmark-circle-outline';
      case 'preparing':
        return 'restaurant';
      case 'pending':
        return 'time';
      default:
        return 'help-circle-outline';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.DEFAULT,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.DEFAULT,
    },
    listContainer: {
      padding: theme.spacing.md,
    },
    orderCard: {
      backgroundColor: theme.colors.surface.DEFAULT,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: theme.colors.text.DEFAULT,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    orderIdContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    orderId: {
      ...theme.typography.body,
      fontWeight: '700',
      color: theme.colors.text.DEFAULT,
    },
    orderDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    orderDate: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    orderDetails: {
      marginBottom: theme.spacing.lg,
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.borderRadius.md,
    },
    customerTextContainer: {
      flex: 1,
    },
    customerName: {
      ...theme.typography.h3,
      color: theme.colors.text.DEFAULT,
      marginBottom: theme.spacing.xs,
    },
    email: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    contactInfo: {
      marginBottom: theme.spacing.md,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
    },
    phone: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    address: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    totalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.primary.DEFAULT,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
    },
    totalLabel: {
      ...theme.typography.body,
      color: theme.colors.text.inverse,
      fontWeight: '600',
    },
    total: {
      ...theme.typography.h3,
      fontWeight: '700',
      color: theme.colors.text.inverse,
    },
    itemsContainer: {
      marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.DEFAULT,
      fontWeight: '600',
    },
    orderItem: {
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary.DEFAULT,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    itemName: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.text.DEFAULT,
    },
    itemQuantity: {
      ...theme.typography.caption,
      color: theme.colors.text.inverse,
      backgroundColor: theme.colors.primary.DEFAULT,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      fontWeight: '700',
    },
    itemDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    itemPrice: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
    },
    itemSubtotal: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.primary.DEFAULT,
    },
    notesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: theme.borderRadius.sm,
    },
    itemNotes: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
    statusInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    statusLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.xl,
    },
    statusText: {
      ...theme.typography.caption,
      fontWeight: '700',
      color: theme.colors.text.inverse,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonText: {
      ...theme.typography.caption,
      color: theme.colors.text.inverse,
      fontWeight: '700',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      marginTop: theme.spacing.xxl,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    emptySubtext: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="receipt" size={20} color={theme.colors.primary.DEFAULT} />
          <Text style={styles.orderId}>Order #{item._id?.toString().padStart(6, '0')}</Text>
        </View>
        <View style={styles.orderDateContainer}>
          <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.customerInfo}>
          <Ionicons name="person" size={20} color={theme.colors.primary.DEFAULT} />
          <View style={styles.customerTextContainer}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        </View>
        
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.phone}>{item.phone || 'No phone provided'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.address}>{item.address || 'No address provided'}</Text>
          </View>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.total}>${item.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="restaurant" size={20} color={theme.colors.text.DEFAULT} />
          <Text style={styles.sectionTitle}>Order Items ({item.items.length})</Text>
        </View>
        {item.items.map((orderItem: OrderItem, index: number) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{orderItem.name}</Text>
              <Text style={styles.itemQuantity}>×{orderItem.quantity}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemPrice}>${orderItem.price.toFixed(2)} each</Text>
              <Text style={styles.itemSubtotal}>
                ${(orderItem.price * orderItem.quantity).toFixed(2)}
              </Text>
            </View>
            {orderItem.toppings && orderItem.toppings.length > 0 && (
              <View style={styles.notesContainer}>
                <Ionicons name="pizza" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.itemNotes}>
                  Toppings: {orderItem.toppings.join(', ')}
                </Text>
              </View>
            )}
            {orderItem.notes && (
              <View style={styles.notesContainer}>
                <Ionicons name="information-circle" size={16} color={theme.colors.text.secondary} />
                <Text style={styles.itemNotes}>{orderItem.notes}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={16} 
              color={theme.colors.text.inverse} 
            />
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.warning }]}
              onPress={() => handleStatusUpdate(item._id, 'preparing')}
            >
              <Ionicons name="restaurant" size={16} color={theme.colors.text.inverse} />
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
          )}
          {item.status === 'preparing' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.info }]}
              onPress={() => handleStatusUpdate(item._id, 'ready')}
            >
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.text.inverse} />
              <Text style={styles.buttonText}>Ready</Text>
            </TouchableOpacity>
          )}
          {item.status === 'ready' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.success }]}
              onPress={() => handleStatusUpdate(item._id, 'delivered')}
            >
              <Ionicons name="car" size={16} color={theme.colors.text.inverse} />
              <Text style={styles.buttonText}>Deliver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.colors.primary.DEFAULT}
        translucent={Platform.OS === 'android'}
      />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.DEFAULT]}
            tintColor={theme.colors.primary.DEFAULT}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              New orders will appear here when customers place them
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}