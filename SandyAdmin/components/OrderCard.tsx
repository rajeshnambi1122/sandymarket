import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from '../types/order';

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order._id}</Text>
        <Text style={styles.status}>{order.status}</Text>
      </View>
      <Text style={styles.customerName}>{order.customerName}</Text>
      <Text style={styles.email}>{order.email}</Text>
      <View style={styles.itemsContainer}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              {item.quantity}x - ${item.price}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${order.totalAmount}</Text>
        <Text style={styles.date}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 14,
    color: '#666',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
}); 