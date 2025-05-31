import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../constants/theme';
import { authAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { adminAPI } from '../../services/api';
import { AuthContext } from '../_layout';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Styles {
  container: ViewStyle;
  loadingContainer: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  content: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  inputGroup: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  saveButton: ViewStyle;
  logoutButton: ViewStyle;
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const { signOut } = useContext(AuthContext);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      console.log('Profile response:', response);
      if (!response) {
        console.error('Invalid profile response:', response);
        Alert.alert('Error', 'Invalid profile data received');
        return;
      }
      setProfile(response);
      setFormData({
        name: response.name,
        email: response.email,
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implement profile update endpoint
      Alert.alert('Info', 'Profile update not implemented yet');
      setEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // The navigation will be handled by the AuthContext
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout properly');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={editing ? formData.name : profile?.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={editing}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={editing ? formData.email : profile?.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.input}>{profile?.role}</Text>
          </View>
          {editing ? (
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.DEFAULT,
    marginBottom: theme.spacing.md,
    fontWeight: '700' as const,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text.DEFAULT,
    marginBottom: theme.spacing.xs,
    fontWeight: '400' as const,
  },
  input: {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border.DEFAULT,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    color: theme.colors.text.DEFAULT,
    fontWeight: '400' as const,
  },
  button: {
    backgroundColor: theme.colors.primary.DEFAULT,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text.light,
    ...theme.typography.body,
    fontWeight: '700' as const,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
}); 