import { Platform } from 'react-native';

export const theme = {
    colors: {
        // Primary colors with gradients
        primary: '#6366f1',
        primaryDark: '#4f46e5',
        primaryLight: '#818cf8',
        primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

        // Secondary colors
        secondary: '#ec4899',
        secondaryDark: '#db2777',
        secondaryLight: '#f472b6',

        // Accent colors
        accent1: '#10b981',
        accent2: '#f59e0b',
        accent3: '#8b5cf6',

        // Background colors
        background: '#0f172a',
        backgroundLight: '#1e293b',
        backgroundCard: 'rgba(30, 41, 59, 0.7)',

        // Text colors
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        textMuted: '#94a3b8',

        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',

        // Severity colors
        severityLow: '#10b981',
        severityMedium: '#f59e0b',
        severityHigh: '#fb923c',
        severityCritical: '#ef4444',

        // Glassmorphism
        glass: 'rgba(255, 255, 255, 0.1)',
        glassLight: 'rgba(255, 255, 255, 0.05)',
        glassBorder: 'rgba(255, 255, 255, 0.2)',
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
        full: 9999,
    },

    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },

    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    shadows: {
        sm: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                android: {
                    elevation: 2,
                },
                web: {
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                },
            }),
        },
        md: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                },
                android: {
                    elevation: 4,
                },
                web: {
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                },
            }),
        },
        lg: {
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.2,
                    shadowRadius: 16,
                },
                android: {
                    elevation: 8,
                },
                web: {
                    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)',
                },
            }),
        },
        glow: {
            ...Platform.select({
                ios: {
                    shadowColor: '#6366f1',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                },
                android: {
                    elevation: 10,
                },
                web: {
                    boxShadow: '0px 0px 20px rgba(99, 102, 241, 0.5)',
                },
            }),
        },
    },

    animations: {
        duration: {
            fast: 200,
            normal: 300,
            slow: 500,
        },
    },
};

export type Theme = typeof theme;
