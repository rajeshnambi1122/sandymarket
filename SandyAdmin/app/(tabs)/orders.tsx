import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Alert,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { theme } from '../../constants/theme';
import { ordersAPI } from '../../services/api';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { Order, OrderItem } from '../../types/order';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

interface Styles {
  container: any;
  loadingContainer: ViewStyle;
  listContainer: ViewStyle;
  orderCard: ViewStyle;
  orderHeader: ViewStyle;
  orderIdContainer: ViewStyle;
  orderId: TextStyle;
  orderDateContainer: ViewStyle;
  orderDate: TextStyle;
  orderDetails: ViewStyle;
  customerInfo: ViewStyle;
  customerTextContainer: ViewStyle;
  customerName: TextStyle;
  email: TextStyle;
  contactInfo: ViewStyle;
  contactItem: ViewStyle;
  phone: TextStyle;
  address: TextStyle;
  totalContainer: ViewStyle;
  totalLabel: TextStyle;
  total: TextStyle;
  itemsContainer: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  orderItem: any;
  itemHeader: ViewStyle;
  itemName: TextStyle;
  itemQuantity: TextStyle;
  itemDetails: ViewStyle;
  itemPrice: TextStyle;
  itemSubtotal: TextStyle;
  notesContainer: ViewStyle;
  itemNotes: TextStyle;
  statusContainer: ViewStyle;
  statusInfo: ViewStyle;
  statusLabel: TextStyle;
  statusBadge: ViewStyle;
  statusText: TextStyle;
  actionButtons: ViewStyle;
  button: ViewStyle;
  completeButton: ViewStyle;
  cancelButton: ViewStyle;
  buttonText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  statusCompleted: ViewStyle;
  statusCancelled: ViewStyle;
  statusPending: ViewStyle;
  statusDelivered: ViewStyle;
  statusReady: ViewStyle;
  statusPreparing: ViewStyle;
  prepareButton: ViewStyle;
  readyButton: ViewStyle;
  deliverButton: ViewStyle;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAllOrders();
      const ordersData = response.data || [];
      const typedOrders = ordersData.map((order: any) => ({
        ...order,
        status: order.status as 'pending' | 'completed' | 'cancelled'
      }));
      
      // Check if there's a new order
      if (lastOrderId && typedOrders.length > 0) {
        const latestOrder = typedOrders[0];
        if (latestOrder._id !== lastOrderId) {
          // Show notification for new order
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'New Order Received',
              body: `Order #${latestOrder._id} from ${latestOrder.customerName}`,
              data: { orderId: latestOrder._id },
            },
            trigger: null,
          });
        }
      }
      
      setOrders(typedOrders);
      if (typedOrders.length > 0) {
        setLastOrderId(typedOrders[0]._id);
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
    // Poll every 10 seconds
    const interval = setInterval(fetchOrders, 10000000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'delivered') => {
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, newStatus);
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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="receipt-outline" size={20} color={theme.colors.primary.DEFAULT} />
          <Text style={styles.orderId}>Order #{item._id}</Text>
        </View>
        <View style={styles.orderDateContainer}>
          <Ionicons name="time-outline" size={16} color={theme.colors.text.light} />
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={20} color={theme.colors.text.DEFAULT} />
          <View style={styles.customerTextContainer}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
        </View>
        
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="call-outline" size={16} color={theme.colors.text.light} />
            <Text style={styles.phone}>{item.phone || 'No phone provided'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={16} color={theme.colors.text.light} />
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
          <Ionicons name="cart-outline" size={20} color={theme.colors.text.DEFAULT} />
          <Text style={styles.sectionTitle}>Order Items</Text>
        </View>
        {item.items.map((orderItem: OrderItem, index: number) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{orderItem.name}</Text>
              <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemPrice}>${orderItem.price.toFixed(2)} each</Text>
              <Text style={styles.itemSubtotal}>
                Subtotal: ${(orderItem.price * orderItem.quantity).toFixed(2)}
              </Text>
            </View>
            {orderItem.notes && (
              <View style={styles.notesContainer}>
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.light} />
                <Text style={styles.itemNotes}>{orderItem.notes}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'delivered' && styles.statusDelivered,
            item.status === 'ready' && styles.statusReady,
            item.status === 'preparing' && styles.statusPreparing,
            item.status === 'pending' && styles.statusPending
          ]}>
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.button, styles.prepareButton]}
              onPress={() => handleStatusUpdate(item._id, 'preparing')}
            >
              <Ionicons name="restaurant-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Start Preparing</Text>
            </TouchableOpacity>
          )}
          {item.status === 'preparing' && (
            <TouchableOpacity
              style={[styles.button, styles.readyButton]}
              onPress={() => handleStatusUpdate(item._id, 'ready')}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Mark Ready</Text>
            </TouchableOpacity>
          )}
          {item.status === 'ready' && (
            <TouchableOpacity
              style={[styles.button, styles.deliverButton]}
              onPress={() => handleStatusUpdate(item._id, 'delivered')}
            >
              <Ionicons name="car-outline" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Mark Delivered</Text>
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
        barStyle="dark-content"
        backgroundColor={theme.colors.white.DEFAULT}
        translucent={Platform.OS === 'android'}
      />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
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
            <Ionicons name="receipt-outline" size={48} color={theme.colors.text.light} />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  orderDetails: {
    marginBottom: theme.spacing.lg,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  contactInfo: {
    marginBottom: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  phone: {
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  address: {
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  totalLabel: {
    ...theme.typography.body,
    color: theme.colors.text.DEFAULT,
  },
  total: {
    ...theme.typography.h3,
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
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
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
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
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  itemPrice: {
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  itemSubtotal: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary.DEFAULT,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  itemNotes: {
    ...theme.typography.body,
    color: theme.colors.text.light,
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusLabel: {
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 9999,
  },
  statusText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#ffffff',
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
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    ...theme.typography.body,
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.light,
    marginTop: theme.spacing.md,
  },
  statusCompleted: {
    backgroundColor: '#22c55e',
  },
  statusCancelled: {
    backgroundColor: '#ef4444',
  },
  statusDelivered: {
    backgroundColor: '#22c55e',
  },
  statusReady: {
    backgroundColor: '#3b82f6',
  },
  statusPreparing: {
    backgroundColor: '#f59e0b',
  },
  statusPending: {
    backgroundColor: '#ef4444',
  },
  prepareButton: {
    backgroundColor: '#f59e0b',
  },
  readyButton: {
    backgroundColor: '#3b82f6',
  },
  deliverButton: {
    backgroundColor: '#22c55e',
  },
}); 