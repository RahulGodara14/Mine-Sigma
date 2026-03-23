import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
}) => {
    const getButtonStyle = (): ViewStyle => {
        const styles: Record<string, ViewStyle> = {
            primary: { backgroundColor: theme.colors.primary },
            secondary: { backgroundColor: theme.colors.secondary },
            success: { backgroundColor: theme.colors.success },
            danger: { backgroundColor: theme.colors.error },
            outline: {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: theme.colors.primary,
            },
        };

        return styles[variant];
    };

    return (
        <TouchableOpacity
            style={[
                componentStyles.button,
                getButtonStyle(),
                disabled && componentStyles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={theme.colors.textPrimary} />
            ) : (
                <Text
                    style={[
                        componentStyles.buttonText,
                        variant === 'outline' && { color: theme.colors.primary },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const componentStyles = StyleSheet.create({
    button: {
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        ...theme.shadows.md,
    },
    buttonText: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
    disabled: {
        opacity: 0.5,
    },
});
