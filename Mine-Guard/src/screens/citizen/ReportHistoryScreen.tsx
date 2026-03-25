import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getTranslations } from '../../services/i18n/translations';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useReportStore } from '../../store/reportStore';
import { Report } from '../../types';
import { backendReportsService } from '../../services/api/backendReportsService';
import { useAuthStore } from '../../store/authStore';

export const ReportHistoryScreen: React.FC = () => {
    const { myReports, setMyReports, isLoadingReports, setLoadingReports } = useReportStore();
    const { disconnect } = useAuthStore();
    const { theme, language } = useThemeStore();
    const t = getTranslations(language);

    const [refreshing, setRefreshing] = useState(false);

    const load = async (isRefresh?: boolean) => {
        try {
            isRefresh ? setRefreshing(true) : setLoadingReports(true);
            const reports = await backendReportsService.myReports(0, 50);
            setMyReports(reports);
        } catch (e: any) {
            // If token is invalid, force logout so Sign In screen appears
            const msg = String(e?.message || '');
            if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('unauthorized')) {
                disconnect();
            }
        } finally {
            isRefresh ? setRefreshing(false) : setLoadingReports(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stats = useMemo(() => {
        const total = myReports.length;
        const approved = myReports.filter((r) => r.status === 'approved').length;
        const pending = myReports.filter((r) => r.status === 'pending' || r.status === 'under_review').length;
        return { total, approved, pending };
    }, [myReports]);

    const getTitle = (r: Report) => {
        switch (r.category) {
            case 'illegal_mining':
                return 'Illegal mining detected ⛏️';
            case 'environmental_damage':
                return 'Environmental damage detected 🌳';
            case 'safety_violation':
                return 'Safety violation detected ⚠️';
            default:
                return 'Report submitted 📋';
        }
    };

    const getStatusColor = (status: Report['status'], theme: any) => {
        switch (status) {
            case 'approved':
                return theme.success || '#10B981';
            case 'rejected':
                return theme.error || '#EF4444';
            case 'under_review':
                return theme.warning || '#F59E0B';
            default:
                return theme.textSecondary || '#999';
        }
    };

    const getSeverityColor = (severity: Report['severity']) => {
        switch (severity) {
            case 'critical':
                return '#DC2626';
            case 'high':
                return '#F97316';
            case 'medium':
                return '#EAB308';
            default:
                return '#22C55E';
        }
    };

    const renderReport = ({ item }: { item: Report }) => (
        <View
            style={[
                styles.reportCard,
                {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.borderColor,
                },
            ]}
        >
            <View style={styles.reportHeader}>
                <View
                    style={[
                        styles.severityBadge,
                        { backgroundColor: getSeverityColor(item.severity) },
                    ]}
                >
                    <Text style={styles.badgeText}>{item.severity.toUpperCase()}</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status, theme) },
                    ]}
                >
                    <Text style={styles.badgeText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
            </View>

            <Text style={[styles.reportTitle, { color: theme.text }]} numberOfLines={2}>
                {getTitle(item)}
            </Text>

            <Text style={[styles.reportDate, { color: theme.textSecondary }]}>
                {new Date(item.timestamp).toLocaleDateString('en-US')}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Header title={t.reports.reportHistory} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
            >
                <Text style={[styles.header, { color: theme.text }]}>
                    {t.reports.reports}
                </Text>

                <View style={styles.statsRow}>
                    <StatCard 
                        label="Total" 
                        value={stats.total.toString()}
                        theme={theme}
                    />
                    <StatCard
                        label="Approved"
                        value={stats.approved.toString()}
                        theme={theme}
                    />
                    <StatCard
                        label="Pending"
                        value={stats.pending.toString()}
                        theme={theme}
                    />
                </View>

                {isLoadingReports && myReports.length === 0 ? (
                    <View
                        style={[
                            styles.emptyCard,
                            {
                                backgroundColor: theme.cardBg,
                                borderColor: theme.borderColor,
                            },
                        ]}
                    >
                        <Text style={[styles.emptyText, { color: theme.text }]}>Loading...</Text>
                    </View>
                ) : myReports.length === 0 ? (
                    <View
                        style={[
                            styles.emptyCard,
                            {
                                backgroundColor: theme.cardBg,
                                borderColor: theme.borderColor,
                            },
                        ]}
                    >
                        <Text style={[styles.emptyText, { color: theme.text }]}>
                            No reports yet
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                            Submit your first report to help protect the environment
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={myReports}
                        renderItem={renderReport}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                    />
                )}

                {/* Footer */}
                <Footer companyName="Gourav Kumar Ojha" />
            </ScrollView>
        </View>
    );
};

const StatCard: React.FC<{
    label: string
    value: string
    theme: any
}> = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
    <View
        style={[
            styles.statCard,
            {
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
            },
        ]}
    >
        <Text style={[styles.statValue, { color: theme.primary }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
);

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
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    reportCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    reportHeader: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
    },
    reportTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    reportDate: {
        fontSize: 12,
        fontWeight: '400',
    },
    reward: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyCard: {
        alignItems: 'center',
        padding: 40,
        borderRadius: 12,
        borderWidth: 1,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
});
