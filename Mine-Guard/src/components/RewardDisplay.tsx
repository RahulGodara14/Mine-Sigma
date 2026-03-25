import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface RewardDisplayProps {
    balance: number;
    pendingRewards: number;
    recentReward?: number;
}

export const RewardDisplay: React.FC<RewardDisplayProps> = ({
    balance,
    pendingRewards,
    recentReward,
}) => {
    const { theme } = useThemeStore();
    const [glowAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        // Glow animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (recentReward) {
            // Scale animation when reward received
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [recentReward]);

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Your Rewards</Text>
            </View>

            <View style={styles.balanceContainer}>
                <Animated.View
                    style={[
                        styles.tokenGlow,
                        {
                            opacity: glowOpacity,
                            transform: [{ scale: scaleAnim }],
                            backgroundColor: theme.primary,
                        },
                    ]}
                />
                <Animated.View style={[
                    styles.tokenIcon,
                    {
                        transform: [{ scale: scaleAnim }],
                        backgroundColor: theme.primary + '20',
                        borderColor: theme.primary,
                    }
                ]}>
                    <Text style={styles.tokenEmoji}>🪙</Text>
                </Animated.View>

                <View style={styles.balanceInfo}>
                    <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Total Balance</Text>
                    <Text style={[styles.balanceValue, { color: theme.text }]}>{balance.toFixed(4)} MATIC</Text>
                </View>
            </View>

            {pendingRewards > 0 && (
                <View style={styles.pendingContainer}>
                    <View style={[styles.pendingBadge, { backgroundColor: theme.primary + '20', borderColor: theme.primary, borderWidth: 1 }]}>
                        <Text style={[styles.pendingText, { color: theme.text }]}>
                            ⏳ Pending: {pendingRewards.toFixed(4)} MATIC
                        </Text>
                    </View>
                </View>
            )}

            {recentReward && recentReward > 0 && (
                <View style={[styles.recentReward, { backgroundColor: theme.primary + '20', borderColor: theme.primary, borderWidth: 1 }]}>
                    <Text style={[styles.recentRewardText, { color: theme.text }]}>
                        🎉 +{recentReward.toFixed(4)} MATIC earned!
                    </Text>
                </View>
            )}

            <View style={styles.infoContainer}>
                <InfoRow label="Reward per report" value="0.1 - 1.0 MATIC" theme={theme} />
                <InfoRow label="Based on" value="Severity & Quality" theme={theme} />
                <InfoRow label="Claim time" value="Instant" theme={theme} />
            </View>
        </View>
    );
};

const InfoRow: React.FC<{ label: string; value: string; theme: any }> = ({ label, value, theme }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    balanceContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        position: 'relative',
    },
    tokenGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.3,
    },
    tokenIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2,
    },
    tokenEmoji: {
        fontSize: 40,
    },
    balanceInfo: {
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    pendingContainer: {
        marginTop: 12,
        alignItems: 'center',
    },
    pendingBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pendingText: {
        fontSize: 12,
        fontWeight: '600',
    },
    recentReward: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    recentRewardText: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoContainer: {
        marginTop: 20,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    infoLabel: {
        fontSize: 12,
    },
    infoValue: {
        fontSize: 12,
        fontWeight: '600',
    },
});
