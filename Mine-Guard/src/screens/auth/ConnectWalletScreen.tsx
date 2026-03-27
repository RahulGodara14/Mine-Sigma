import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { theme } from '../../theme';
import { globalStyles } from '../../styles/globalStyles';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { web3Service } from '../../services/blockchain/web3Service';
import { useAuthStore } from '../../store/authStore';

export const ConnectWalletScreen: React.FC<{ navigation: any }> = ({
    navigation,
}) => {
    const [connecting, setConnecting] = useState(false);
    const { setWalletAddress, setRole, setConnected } = useAuthStore();

    const handleConnectWallet = async () => {
        setConnecting(true);

        try {
            // Connect wallet (in production, use MetaMask/WalletConnect)
            const address = await web3Service.connectWallet();

            setWalletAddress(address);
            setRole('citizen'); // Default role
            setConnected(true);

            // Navigate to main app
            navigation.replace('MainApp');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        } finally {
            setConnecting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={globalStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                <Card glass style={styles.card}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoEmoji}>🛡️</Text>
                        <Text style={styles.appName}>MineGuard</Text>
                        <Text style={styles.tagline}>
                            Protecting our environment through blockchain transparency
                        </Text>
                    </View>

                    <View style={styles.features}>
                        <FeatureItem
                            icon="📸"
                            title="Report Anonymously"
                            description="Upload geo-tagged evidence securely"
                        />
                        <FeatureItem
                            icon="🔒"
                            title="Privacy Protected"
                            description="Your identity stays on the blockchain"
                        />
                        <FeatureItem
                            icon="🪙"
                            title="Earn Rewards"
                            description="Get tokens for verified reports"
                        />
                    </View>

                    <Button
                        title="Connect Wallet"
                        onPress={handleConnectWallet}
                        loading={connecting}
                        variant="primary"
                        style={styles.connectButton}
                    />

                    <Text style={styles.networkInfo}>
                        Network: Polygon Mumbai Testnet
                    </Text>
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
};

const FeatureItem: React.FC<{
    icon: string;
    title: string;
    description: string;
}> = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>{icon}</Text>
        <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: theme.spacing.md,
    },
    card: {
        padding: theme.spacing.xl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    logoEmoji: {
        fontSize: 80,
        marginBottom: theme.spacing.md,
    },
    appName: {
        fontSize: theme.fontSize.xxxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    tagline: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    features: {
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    featureIcon: {
        fontSize: 32,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs / 2,
    },
    featureDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    connectButton: {
        marginTop: theme.spacing.lg,
    },
    networkInfo: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: theme.spacing.md,
    },
});
