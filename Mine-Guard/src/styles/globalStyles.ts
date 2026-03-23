import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: theme.spacing.md,
        // Responsive width for web
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    card: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    glassCard: {
        backgroundColor: theme.colors.glass,
        // @ts-ignore - backdropFilter is valid for web but not typed in RN
        backdropFilter: 'blur(10px)',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    textPrimary: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.regular,
    },
    textSecondary: {
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.regular,
    },
    textMuted: {
        color: theme.colors.textMuted,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.regular,
    },
    heading: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        marginBottom: theme.spacing.md,
    },
    subheading: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        marginBottom: theme.spacing.sm,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    buttonText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
    input: {
        backgroundColor: theme.colors.backgroundLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    badge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textPrimary,
    },
});
