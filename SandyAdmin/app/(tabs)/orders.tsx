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
} from 'react-native';
import { theme } from '../../constants/theme';
import { ordersAPI } from '../../services/api';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

interface Order {
  _id: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAllOrders();
      if (!response.success || !Array.isArray(response.data)) {
        console.error('Invalid response format:', response);
        setOrders([]);
        return;
      }
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={48} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      <View style={styles.content}>
        {!orders || orders.length === 0 ? (
          <Text style={styles.noDataText}>No orders available</Text>
        ) : (
          orders.map((order) => (
            <Card key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.orderStatus,
                    { color: getStatusColor(order.status) },
                  ]}
                >
                  {order.status}
                </Text>
              </View>

              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>Total: ${order.totalAmount.toFixed(2)}</Text>
                <View style={styles.statusButtons}>
                  {order.status !== 'completed' && (
                    <TouchableOpacity
                      style={[styles.statusButton, styles.completeButton]}
                      onPress={() => updateOrderStatus(order._id, 'completed')}
                    >
                      <Text style={styles.statusButtonText}>Complete</Text>
                    </TouchableOpacity>
                  )}
                  {order.status !== 'cancelled' && (
                    <TouchableOpacity
                      style={[styles.statusButton, styles.cancelButton]}
                      onPress={() => updateOrderStatus(order._id, 'cancelled')}
                    >
                      <Text style={styles.statusButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return theme.colors.primary[500];
    case 'pending':
      return '#f59e0b';
    case 'cancelled':
      return '#ef4444';
    default:
      return theme.colors.text.DEFAULT;
  }
};

interface Styles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  content: ViewStyle;
  orderCard: ViewStyle;
  orderHeader: ViewStyle;
  orderCustomer: TextStyle;
  orderDate: TextStyle;
  orderStatus: TextStyle;
  orderItems: ViewStyle;
  orderItem: ViewStyle;
  itemName: TextStyle;
  itemQuantity: TextStyle;
  itemPrice: TextStyle;
  orderFooter: ViewStyle;
  orderTotal: TextStyle;
  statusButtons: ViewStyle;
  statusButton: ViewStyle;
  completeButton: ViewStyle;
  cancelButton: ViewStyle;
  statusButtonText: TextStyle;
  noDataText: TextStyle;
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
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text.light,
    fontWeight: '700' as const,
  } as TextStyle,
  content: {
    padding: theme.spacing.lg,
  },
  orderCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  orderCustomer: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.text.DEFAULT,
  },
  orderDate: {
    ...theme.typography.caption,
    color: theme.colors.text.DEFAULT,
    marginTop: theme.spacing.xs,
    fontWeight: '400' as const,
  } as TextStyle,
  orderStatus: {
    ...theme.typography.caption,
    fontWeight: 'bold',
  },
  orderItems: {
    marginBottom: theme.spacing.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  itemName: {
    ...theme.typography.body,
    flex: 1,
    fontWeight: '400' as const,
  } as TextStyle,
  itemQuantity: {
    ...theme.typography.caption,
    color: theme.colors.text.DEFAULT,
    marginHorizontal: theme.spacing.md,
    fontWeight: '400' as const,
  } as TextStyle,
  itemPrice: {
    ...theme.typography.body,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.DEFAULT,
  },
  orderTotal: {
    ...theme.typography.body,
    fontWeight: 'bold',
    color: theme.colors.primary.DEFAULT,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  completeButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  statusButtonText: {
    color: theme.colors.text.light,
    fontWeight: 'bold',
  },
  noDataText: {
    ...theme.typography.body,
    color: theme.colors.text.DEFAULT,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
}); 