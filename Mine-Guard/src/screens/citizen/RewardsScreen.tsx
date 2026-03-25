import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getTranslations } from '../../services/i18n/translations';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { RewardDisplay } from '../../components/RewardDisplay';

export const RewardsScreen: React.FC = () => {
    const { theme, language } = useThemeStore();
    const t = getTranslations(language);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t.rewards.rewards} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.header, { color: theme.text }]}>
                    {t.rewards.rewards}
                </Text>

                <RewardDisplay balance={0} pendingRewards={0} />

                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Recent Transactions
                </Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No transactions yet
                </Text>

                {/* Info Card */}
                <View
                    style={[
                        styles.infoCard,
                        {
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                        },
                    ]}
                >
                    <Text style={[styles.infoTitle, { color: theme.primary }]}>
                        💡 How to Earn Rewards
                    </Text>
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        Submit detailed reports of illegal mining activities. Each approved report earns you MATIC tokens
                        based on the severity level.
                    </Text>
                </View>

                {/* Footer */}
                <Footer companyName="Gourav Kumar Ojha" />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 16,
    },
    infoCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
    },
});
