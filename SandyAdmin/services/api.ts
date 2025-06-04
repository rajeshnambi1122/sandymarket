import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the main backend URL
const API_URL = 'https://api.sandysmarket.net/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 Token from storage:', token ? token.substring(0, 20) + '...' : 'Not found');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set:', config.headers.Authorization);
      } else {
        console.log('❌ No token found in storage');
      }
      return config;
    } catch (error) {
      console.error('❌ Error getting token from storage:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
      return Promise.reject({
        success: false,
        message: 'No response from server. Please check your internet connection.'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
      return Promise.reject({
        success: false,
        message: 'An error occurred while setting up the request.'
      });
    }
  }
);

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error: any) {
      throw {
        success: false,
        message: error.message || 'Login failed. Please try again.'
      };
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    address?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};

// Orders API calls
export const ordersAPI = {
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrderById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: number | string, status: string) => {
    const response = await api.patch(`/orders/${id}`, { status });
    return response.data;
  },
};

// Admin API calls
export const adminAPI = {
  getProfile: async () => {
    const response = await api.get('/admin/profile');
    return response.data;
  },

  updateProfile: async (data: { name: string; email: string }) => {
    const response = await api.put('/admin/profile', data);
    return response.data;
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  updateFCMToken: async (token: string) => {
    try {
      console.log('Sending FCM token to backend:', {
        token: token.substring(0, 20) + '...',
        endpoint: '/auth/fcm-token'
      });
      
      const response = await api.post('/auth/fcm-token', { token });
      console.log('FCM token update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw error;
    }
  },
};

export default api; 