import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface CardProps {
    children: React.ReactNode;
    glass?: boolean;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    glass = false,
    style,
}) => {
    return (
        <View
            style={[
                componentStyles.card,
                glass && componentStyles.glassCard,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const componentStyles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.backgroundCard,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
        ...theme.shadows.md,
    },
    glassCard: {
        backgroundColor: theme.colors.glass,
    },
});
