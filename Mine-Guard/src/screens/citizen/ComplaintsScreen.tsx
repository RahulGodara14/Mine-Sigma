import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/common/Button';
import { backendComplaintsService, type ComplaintItem, type ComplaintStatus } from '../../services/api/backendComplaintsService';

const statusLabel = (s: string) => s.replaceAll('_', ' ').toUpperCase();

export const ComplaintsScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ComplaintItem[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('illegal_mining');

  const load = async (isRefresh?: boolean) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await backendComplaintsService.myComplaints();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load complaints');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await backendComplaintsService.create({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
      });
      setTitle('');
      setDescription('');
      await load(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const colorForStatus = (s: ComplaintStatus | string) => {
    const v = (s ?? '').toString();
    if (v === 'resolved') return theme.success || '#10B981';
    if (v === 'in_progress') return theme.primary || '#22C55E';
    if (v === 'under_review') return theme.warning || '#F59E0B';
    if (v === 'rejected') return theme.error || '#EF4444';
    return theme.textSecondary || '#94A3B8';
  };

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }, [items]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Complaints" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.primary} />}
      >
        {error && (
          <Text style={[styles.errorText, { color: theme.error || '#EF4444' }]}>{error}</Text>
        )}

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Submit a Complaint</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Short title"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.borderColor, backgroundColor: theme.background }]}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="illegal_mining"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.borderColor, backgroundColor: theme.background }]}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.textArea, { color: theme.text, borderColor: theme.borderColor, backgroundColor: theme.background }]}
          />

          <Button title={loading ? 'Submitting...' : 'Submit Complaint'} onPress={submit} variant="primary" />
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>My Complaints</Text>

          {sorted.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No complaints yet.</Text>
          ) : (
            sorted.map((c) => (
              <View key={c.id} style={[styles.item, { borderColor: theme.borderColor }]}> 
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{c.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: colorForStatus(c.status) }]}> 
                    <Text style={styles.statusText}>{statusLabel(c.status)}</Text>
                  </View>
                </View>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {c.category ?? ''} • {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                </Text>
                <Text style={[styles.itemDesc, { color: theme.text }]} numberOfLines={3}>{c.description}</Text>
              </View>
            ))
          )}
        </View>

        <Footer companyName="Gourav Kumar Ojha" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  textArea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 90, marginBottom: 12 },
  errorText: { marginBottom: 12, fontSize: 13, fontWeight: '600' },
  emptyText: { fontSize: 13 },
  item: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  itemMeta: { fontSize: 12, marginTop: 4 },
  itemDesc: { fontSize: 13, marginTop: 6 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { color: '#0B1220', fontSize: 10, fontWeight: '800' },
});
