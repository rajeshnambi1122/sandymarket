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
} from 'react-native';
import { theme } from '../../constants/theme';
import { ordersAPI } from '../../services/api';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

interface Order {
  _id: string;
  customerName: string;
  email: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Styles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  listContainer: ViewStyle;
  orderCard: ViewStyle;
  orderHeader: ViewStyle;
  orderId: TextStyle;
  orderDate: TextStyle;
  orderDetails: ViewStyle;
  customerName: TextStyle;
  email: TextStyle;
  total: TextStyle;
  itemsContainer: ViewStyle;
  itemText: TextStyle;
  statusContainer: ViewStyle;
  status: TextStyle;
  actionButtons: ViewStyle;
  button: ViewStyle;
  completeButton: ViewStyle;
  cancelButton: ViewStyle;
  buttonText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAllOrders();
      if (response.success) {
        setOrders(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
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
        <Text style={styles.orderId}>Order #{item._id}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.total}>Total: ${item.totalAmount.toFixed(2)}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.quantity}x {orderItem.name}
            {orderItem.size ? ` (${orderItem.size})` : ''}
            {orderItem.toppings?.length > 0 ? ` + ${orderItem.toppings.join(', ')}` : ''}
          </Text>
        ))}
      </View>

      <View style={styles.statusContainer}>
        <Text style={[
          styles.status,
          { color: item.status === 'completed' ? '#22c55e' : 
                  item.status === 'cancelled' ? '#ef4444' :
                  '#f59e0b' }
        ]}>
          {item.status.toUpperCase()}
        </Text>
        
        <View style={styles.actionButtons}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.completeButton]}
                onPress={() => handleStatusUpdate(item._id, 'completed')}
              >
                <Text style={styles.buttonText}>Complete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => handleStatusUpdate(item._id, 'cancelled')}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </>
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
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
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
    backgroundColor: theme.colors.background.DEFAULT,
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
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  orderId: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.text.DEFAULT,
  },
  orderDate: {
    ...theme.typography.body,
    color: theme.colors.text.light,
  },
  orderDetails: {
    marginBottom: theme.spacing.md,
  },
  customerName: {
    ...theme.typography.h3,
    color: theme.colors.text.DEFAULT,
    marginBottom: theme.spacing.xs,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.text.light,
    marginBottom: theme.spacing.xs,
  },
  total: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary.DEFAULT,
  },
  itemsContainer: {
    marginBottom: theme.spacing.md,
  },
  itemText: {
    ...theme.typography.body,
    color: theme.colors.text.DEFAULT,
    marginBottom: theme.spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    ...theme.typography.body,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    ...theme.typography.body,
    color: theme.colors.text.light,
    fontWeight: '700',
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
  },
}); 