import { Appearance } from 'react-native';

export const lightTheme = {
  colors: {
    primary: {
      DEFAULT: '#ea580c', // Orange-600
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    background: {
      DEFAULT: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    },
    surface: {
      DEFAULT: '#ffffff',
      elevated: '#ffffff',
    },
    text: {
      DEFAULT: '#111827',
      secondary: '#6b7280',
      light: '#9ca3af',
      inverse: '#ffffff',
    },
    border: {
      DEFAULT: '#e5e7eb',
      light: '#f3f4f6',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
  },
};

export const darkTheme = {
  colors: {
    primary: {
      DEFAULT: '#fb923c', // Orange-400 (lighter for dark mode)
      50: '#7c2d12',
      100: '#9a3412',
      200: '#c2410c',
      300: '#ea580c',
      400: '#fb923c',
      500: '#f97316',
      600: '#fdba74',
      700: '#fed7aa',
      800: '#ffedd5',
      900: '#fff7ed',
    },
    background: {
      DEFAULT: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    surface: {
      DEFAULT: '#1e293b',
      elevated: '#334155',
    },
    text: {
      DEFAULT: '#f8fafc',
      secondary: '#cbd5e1',
      light: '#94a3b8',
      inverse: '#0f172a',
    },
    border: {
      DEFAULT: '#475569',
      light: '#334155',
    },
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography,
};

export const theme = lightTheme; // Default export for backward compatibility