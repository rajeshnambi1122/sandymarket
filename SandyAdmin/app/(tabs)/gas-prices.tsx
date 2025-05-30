import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../constants/theme';
import { gasPricesAPI } from '../../services/api';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/loading-spinner';

interface GasPrice {
  _id: string;
  type: string;
  price: number;
}

export default function GasPricesScreen() {
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingPrice, setEditingPrice] = useState<GasPrice | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const fetchGasPrices = async () => {
    try {
      const response = await gasPricesAPI.getAllGasPrices();
      console.log('Gas prices response:', response);
      if (!Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setGasPrices([]);
        return;
      }
      setGasPrices(response);
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      setGasPrices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGasPrices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGasPrices();
  };

  const handleEdit = (price: GasPrice) => {
    setEditingPrice(price);
    setNewPrice(price.price.toString());
  };

  const handleSave = async () => {
    if (!editingPrice || !newPrice) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0');
      return;
    }

    try {
      await gasPricesAPI.updateGasPrice(editingPrice._id, price);
      Alert.alert('Success', 'Gas price updated successfully');
      setEditingPrice(null);
      setNewPrice('');
      fetchGasPrices();
    } catch (error) {
      console.error('Error updating gas price:', error);
      Alert.alert('Error', 'Failed to update gas price. Please try again.');
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
        <Text style={styles.title}>Gas Prices</Text>
      </View>

      <View style={styles.content}>
        {gasPrices.length === 0 ? (
          <Text style={styles.noDataText}>No gas prices available</Text>
        ) : (
          gasPrices.map((price) => (
            <Card key={price._id} style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Text style={styles.priceType}>{price.type || 'Unknown Type'}</Text>
                {editingPrice?._id === price._id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.priceInput}
                      value={newPrice}
                      onChangeText={setNewPrice}
                      keyboardType="decimal-pad"
                      placeholder="Enter new price"
                    />
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleSave}
                    >
                      <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => {
                        setEditingPrice(null);
                        setNewPrice('');
                      }}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      ${typeof price.price === 'number' ? price.price.toFixed(2) : '0.00'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.button, styles.editButton]}
                      onPress={() => handleEdit(price)}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

interface Styles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  content: ViewStyle;
  priceCard: ViewStyle;
  priceHeader: ViewStyle;
  priceType: TextStyle;
  priceContainer: ViewStyle;
  price: TextStyle;
  editContainer: ViewStyle;
  priceInput: TextStyle;
  button: ViewStyle;
  editButton: ViewStyle;
  saveButton: ViewStyle;
  cancelButton: ViewStyle;
  buttonText: TextStyle;
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
  },
  content: {
    padding: theme.spacing.lg,
  },
  priceCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceType: {
    ...theme.typography.h3,
    color: theme.colors.text.DEFAULT,
    fontWeight: '700' as const,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  price: {
    ...theme.typography.h2,
    color: theme.colors.primary.DEFAULT,
    fontWeight: '700' as const,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  priceInput: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    width: 100,
    fontWeight: '400' as const,
  },
  button: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  editButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: theme.colors.text.light,
    fontWeight: '700' as const,
  },
  noDataText: {
    ...theme.typography.body,
    color: theme.colors.text.DEFAULT,
    fontWeight: '400' as const,
    textAlign: 'center',
  },
}); 