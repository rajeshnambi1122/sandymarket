import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { authAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AuthContext } from '../_layout';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';

interface Styles {
  container: ViewStyle;
  scrollContent: ViewStyle;
  formContainer: ViewStyle;
  title: TextStyle;
  inputContainer: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  inputError: TextStyle;
  errorText: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  logoContainer: ViewStyle;
  logo: ImageStyle;
  passwordContainer: ViewStyle;
  eyeButton: ViewStyle;
}

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { signIn } = useContext(AuthContext);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.token) {
        // Use the AuthContext to sign in
        await signIn(response.token);
        // The navigation will be handled by the AuthContext
      } else {
        Alert.alert(
          'Login Failed',
          'Invalid response from server. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        error.message || 'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary[900] }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.primary[900]} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.formContainer, { backgroundColor: theme.colors.surface.DEFAULT }]}>
            <Text style={[styles.title, { color: theme.colors.primary.DEFAULT }]}>Admin Login</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.DEFAULT }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    borderColor: theme.colors.border.DEFAULT,
                    color: theme.colors.text.DEFAULT,
                    backgroundColor: theme.colors.background.DEFAULT
                  },
                  errors.email && styles.inputError
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.text.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.DEFAULT }]}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      borderColor: theme.colors.border.DEFAULT,
                      color: theme.colors.text.DEFAULT,
                      backgroundColor: theme.colors.background.DEFAULT,
                      flex: 1
                    },
                    errors.password && styles.inputError
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <FontAwesome
                    name={showPassword ? 'eye-slash' : 'eye'}
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary.DEFAULT }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" color={theme.colors.text.inverse} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.colors.text.inverse }]}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
  },
  formContainer: {
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
}); 