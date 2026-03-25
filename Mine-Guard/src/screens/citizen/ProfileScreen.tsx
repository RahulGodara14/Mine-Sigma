import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getTranslations } from '../../services/i18n/translations';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { generateAnonymousId } from '../../utils/encryption';

export const ProfileScreen: React.FC = () => {
  const { walletAddress, disconnect, email } = useAuthStore();
  const { theme, isDark, toggleTheme, language, setLanguage } = useThemeStore();
  const t = getTranslations(language);

  const handleDisconnect = () => {
    Alert.alert(
      t.profile.logout || 'Logout',
      'Are you sure you want to log out?',
      [
        { text: t.common.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.profile.logout || 'Logout',
          style: 'destructive',
          onPress: () => disconnect(),
        },
      ]
    );
  };

  const anonymousId = walletAddress ? generateAnonymousId(walletAddress) : '';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={t.profile.profile} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View
          style={[
            styles.profileHeader,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={styles.avatar}>👤</Text>
          <Text style={[styles.nameLabel, { color: theme.text }]}>
            {t.profile.personalInfo || 'Registered User'}
          </Text>
          <Text style={[styles.anonymousId, { color: theme.textSecondary }]}>
            {anonymousId}
          </Text>
        </View>

        {/* Account Information */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t.profile.personalInfo || 'Account Information'}
          </Text>
          {email ? (
            <InfoRow 
              label={t.auth.email || 'Email'} 
              value={email}
              textColor={theme.text}
              labelColor={theme.textSecondary}
              borderColor={theme.borderColor}
            />
          ) : null}
          <InfoRow 
            label={t.profile.wallet || 'Wallet Address'} 
            value={walletAddress?.substring(0, 10) + '...' || 'Not connected'}
            textColor={theme.text}
            labelColor={theme.textSecondary}
            borderColor={theme.borderColor}
          />
          <InfoRow 
            label="Network" 
            value="Ethereum (Ganache)"
            textColor={theme.text}
            labelColor={theme.textSecondary}
            borderColor={theme.borderColor}
          />
          <InfoRow 
            label="Role" 
            value="Citizen"
            textColor={theme.text}
            labelColor={theme.textSecondary}
            borderColor={theme.borderColor}
          />
        </View>

        {/* Settings */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t.profile.settings || 'Settings'}
          </Text>

          {/* Language Selection */}
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {t.profile.language || 'Language'}
            </Text>
            <View style={styles.languageRow}>
              {(['en', 'hi', 'hinglish'] as const).map((lang) => (
                <Button
                  key={lang}
                  title={lang === 'en' ? '🇺🇸 EN' : lang === 'hi' ? '🇮🇳 HI' : '🇮🇳 Hinglish'}
                  onPress={() => setLanguage(lang)}
                  variant={language === lang ? 'primary' : 'outline'}
                  style={styles.langButton}
                />
              ))}
            </View>
          </View>

          {/* Theme Toggle */}
          <View style={styles.settingGroup}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              {t.profile.darkMode || 'Dark Mode'}
            </Text>
            <Button
              title={isDark ? '🌙 Dark' : '☀️ Light'}
              onPress={toggleTheme}
              variant="outline"
              style={styles.themeButton}
            />
          </View>
        </View>

        {/* Security */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.securityBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Security</Text>
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            🔐 Your private key is never exposed. All transactions are signed locally on your device.
          </Text>
        </View>

        {/* Logout Button */}
        <Button
          title={t.profile.logout || 'Logout'}
          onPress={handleDisconnect}
          variant="danger"
          style={styles.logoutButton}
        />

        {/* Footer */}
        <Footer companyName="Gourav Kumar Ojha" />
      </ScrollView>
    </View>
  );
};

const InfoRow: React.FC<{
  label: string
  value: string
  textColor: string
  labelColor: string
  borderColor: string
}> = ({ label, value, textColor, labelColor, borderColor }) => (
  <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
    <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatar: {
    fontSize: 60,
    marginBottom: 12,
  },
  nameLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  anonymousId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingGroup: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langButton: {
    flex: 1,
    minHeight: 40,
  },
  themeButton: {
    minHeight: 40,
  },
  securityBg: {
    opacity: 0.7,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 16,
  },
});
