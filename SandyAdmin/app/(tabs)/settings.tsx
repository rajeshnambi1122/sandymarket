import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { authAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../_layout';

interface AdminProfile {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setProfile(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.DEFAULT,
    },
    content: {
      padding: theme.spacing.lg,
    },
    section: {
      backgroundColor: theme.colors.surface.DEFAULT,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.text.DEFAULT,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.DEFAULT,
      marginBottom: theme.spacing.md,
      fontWeight: '600',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      ...theme.typography.caption,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    infoValue: {
      ...theme.typography.body,
      color: theme.colors.text.DEFAULT,
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButton: {
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.surface.DEFAULT,
      borderColor: theme.colors.error,
      borderWidth: 1,
    },
    logoutContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
    },
    logoutIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.error}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
    },
    logoutText: {
      ...theme.typography.body,
      fontWeight: '600',
      fontSize: 14,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="person" size={20} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{profile?.name || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail" size={20} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email || 'Not set'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="call" size={20} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profile?.phone || 'Not set'}</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield" size={20} color={theme.colors.primary.DEFAULT} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{profile?.role || 'Not set'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.section, styles.logoutButton]} 
        onPress={signOut}
      >
        <View style={styles.logoutContent}>
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out" size={24} color={theme.colors.error} />
          </View>
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>
            Sign Out
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}