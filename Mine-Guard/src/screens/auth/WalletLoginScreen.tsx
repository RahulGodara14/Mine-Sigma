import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { theme } from '../../theme';
import { globalStyles } from '../../styles/globalStyles';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { web3Service } from '../../services/blockchain/web3Service';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';

export const WalletLoginScreen: React.FC<{ navigation: any }> = ({
    navigation,
}) => {
    const [loading, setLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');

    const { setJwtToken, setUserId, setWalletAddress: setStoreWalletAddress, setRole, setEmail } = useAuthStore();

    const handleWalletLogin = async () => {
        setLoading(true);

        try {
            // Connect to MetaMask
            const address = await web3Service.connectMetaMask();
            setWalletAddress(address);

            // Get nonce from backend
            const { nonce } = await authService.getNonce(address);

            // Sign the nonce
            const signature = await web3Service.signMessage(nonce);

            // Verify and get JWT token
            const response = await authService.verifyWallet(address, signature, nonce);

            setJwtToken(response.token);
            authService.setAuthHeader(response.token);

            Alert.alert('Success', 'Logged in with wallet!');
            navigation.replace('MainApp');
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
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
                        <Text style={styles.subtitle}>Login with Your Wallet</Text>
                    </View>

                    <Card style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Web3 Authentication</Text>
                        <Text style={styles.infoText}>
                            Sign a message with your MetaMask wallet to securely login without
                            exposing your private key
                        </Text>
                    </Card>

                    <View style={styles.steps}>
                        <StepItem
                            number={1}
                            title="Connect MetaMask"
                            description="Click the button below"
                        />
                        <StepItem
                            number={2}
                            title="Sign Message"
                            description="Sign a verification message"
                        />
                        <StepItem
                            number={3}
                            title="Get Logged In"
                            description="Receive JWT token"
                        />
                    </View>

                    {walletAddress && (
                        <Card style={styles.addressCard}>
                            <Text style={styles.addressLabel}>Connected Address:</Text>
                            <Text style={styles.address}>
                                {walletAddress.substring(0, 10)}...{walletAddress.substring(32)}
                            </Text>
                        </Card>
                    )}

                    <Button
                        title={walletAddress ? 'Proceed with Login' : 'Connect MetaMask'}
                        onPress={handleWalletLogin}
                        loading={loading}
                        variant="primary"
                        style={styles.connectButton}
                    />

                    <Button
                        title="Back to Login"
                        onPress={() => navigation.goBack()}
                        variant="outline"
                        disabled={loading}
                        style={styles.backButton}
                    />
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
};

const StepItem: React.FC<{ number: number; title: string; description: string }> = ({
    number,
    title,
    description,
}) => (
    <View style={styles.stepItem}>
        <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepDescription}>{description}</Text>
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
        marginBottom: theme.spacing.lg,
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
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    infoCard: {
        backgroundColor: theme.colors.info,
        marginBottom: theme.spacing.lg,
    },
    infoTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    infoText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textPrimary,
        lineHeight: 20,
    },
    steps: {
        marginVertical: theme.spacing.lg,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    stepNumberText: {
        color: theme.colors.textPrimary,
        fontWeight: theme.fontWeight.bold,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    stepDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    addressCard: {
        marginVertical: theme.spacing.lg,
    },
    addressLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.xs,
    },
    address: {
        fontSize: theme.fontSize.md,
        fontFamily: 'monospace',
        color: theme.colors.textPrimary,
        fontWeight: theme.fontWeight.bold,
    },
    connectButton: {
        marginTop: theme.spacing.lg,
    },
    backButton: {
        marginTop: theme.spacing.md,
    },
});
