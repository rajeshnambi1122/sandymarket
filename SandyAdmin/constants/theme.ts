import { TextStyle } from 'react-native';

export const theme = {
  colors: {
    primary: {
      DEFAULT: '#2563eb',
      foreground: '#ffffff',
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    background: {
      DEFAULT: '#f8fafc',
      dark: '#0f172a',
    },
    text: {
      DEFAULT: '#1e293b',
      light: '#f8fafc',
    },
    border: {
      DEFAULT: '#e2e8f0',
    },
    error: {
      DEFAULT: '#ef4444',
    },
    white: {
      DEFAULT: '#ffffff',
    },
    black: {
      DEFAULT: '#000000',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
  typography: {
    h1: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 20,
      fontWeight: '700' as const,
    },
    h3: {
      fontSize: 18,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
  },
}; 