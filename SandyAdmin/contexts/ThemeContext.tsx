import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { theme as lightTheme } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dark theme configuration
const darkTheme = {
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

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

const THEME_PREFERENCE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedPreference !== null) {
          setIsDark(savedPreference === 'dark');
        } else {
          setIsDark(colorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        setIsDark(colorScheme === 'dark');
      }
    };

    loadThemePreference();
  }, [colorScheme]);

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };

    saveThemePreference();
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 