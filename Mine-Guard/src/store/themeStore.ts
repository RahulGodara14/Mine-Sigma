import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'hi' | 'hinglish';

export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  inputBg: string;
  inputBorder: string;
  button: string;
  buttonText: string;
  borderColor: string;
  cardBg: string;
  headerBg: string;
  footerBg: string;
  gradientStart: string;
  gradientEnd: string;
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
}

const lightTheme: ThemeColors = {
  background: '#F5F7FA',
  text: '#1A1A1A',
  textSecondary: '#666666',
  inputBg: '#FFFFFF',
  inputBorder: '#D1D5DB',
  button: '#6366F1',
  buttonText: '#FFFFFF',
  borderColor: '#E5E7EB',
  cardBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  footerBg: '#F3F4F6',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  primary: '#6366F1',
  secondary: '#EC4899',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  inputBg: '#1E293B',
  inputBorder: '#334155',
  button: '#818CF8',
  buttonText: '#1A1A1A',
  borderColor: '#334155',
  cardBg: '#1E293B',
  headerBg: '#0F172A',
  footerBg: '#1E293B',
  gradientStart: '#6366F1',
  gradientEnd: '#8B5CF6',
  primary: '#818CF8',
  secondary: '#EC4899',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

interface ThemeStore {
  isDark: boolean;
  theme: ThemeColors;
  language: Language;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: false,
      theme: lightTheme,
      language: 'en',
      themeMode: 'light',
      toggleTheme: () =>
        set((state) => ({
          isDark: !state.isDark,
          theme: state.isDark ? lightTheme : darkTheme,
        })),
      setThemeMode: (mode: ThemeMode) => {
        set({
          themeMode: mode,
          isDark: mode === 'dark' || (mode === 'auto' && false),
          theme: mode === 'dark' ? darkTheme : lightTheme,
        });
      },
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: 'theme-store',
      storage: {
        getItem: async (name: string) => {
          try {
            const item = await AsyncStorage.getItem(name);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.error('Failed to get theme from storage:', error);
            return null;
          }
        },
        setItem: async (name: string, value: any) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Failed to save theme to storage:', error);
          }
        },
        removeItem: async (name: string) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.error('Failed to remove theme from storage:', error);
          }
        },
      },
    }
  )
);
