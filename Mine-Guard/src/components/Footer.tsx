import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getTranslations } from '../services/i18n/translations';

interface FooterProps {
  companyName?: string;
  showSocialLinks?: boolean;
}

const { width } = Dimensions.get('window');

export const Footer: React.FC<FooterProps> = ({
  companyName = 'Gourav Kumar Ojha',
  showSocialLinks = true,
}) => {
  const { theme, isDark } = useThemeStore();

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: theme.footerBg,
          borderTopColor: theme.borderColor,
        },
      ]}
    >
      <View style={styles.container}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <Text style={[styles.appName, { color: theme.primary }]}>MineGuard</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Report Illegal Mining
          </Text>
        </View>

        {/* Middle Section */}
        <View style={styles.middleSection}>
          <View style={styles.linkGroup}>
            <Text style={[styles.linkTitle, { color: theme.text }]}>Product</Text>
            <Text style={[styles.link, { color: theme.textSecondary }]}>Features</Text>
            <Text style={[styles.link, { color: theme.textSecondary }]}>
              How It Works
            </Text>
          </View>

          <View style={styles.linkGroup}>
            <Text style={[styles.linkTitle, { color: theme.text }]}>Support</Text>
            <Text style={[styles.link, { color: theme.textSecondary }]}>
              Help Center
            </Text>
            <Text style={[styles.link, { color: theme.textSecondary }]}>Contact</Text>
          </View>

          <View style={styles.linkGroup}>
            <Text style={[styles.linkTitle, { color: theme.text }]}>Legal</Text>
            <Text style={[styles.link, { color: theme.textSecondary }]}>Privacy</Text>
            <Text style={[styles.link, { color: theme.textSecondary }]}>Terms</Text>
          </View>
        </View>

        {/* Bottom Section */}
        <View
          style={[
            styles.bottomSection,
            {
              borderTopColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>
            © 2025 {companyName}. All rights reserved.
          </Text>
          <View style={styles.badges}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.primary + '20',
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {isDark ? '🌙' : '☀️'} Responsive
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.secondary + '20',
                  borderColor: theme.secondary,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: theme.secondary }]}>
                🌐 Multilingual
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Decorative Line */}
      <View
        style={[
          styles.decorativeLine,
          {
            backgroundColor: `${theme.primary}30`,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '400',
  },
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  linkGroup: {
    marginBottom: 8,
  },
  linkTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  link: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '400',
  },
  bottomSection: {
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '400',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  decorativeLine: {
    height: 1,
    marginTop: 6,
    borderRadius: 1,
  },
});
