import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getTranslations } from '../../services/i18n/translations';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Card } from '../../components/common/Card';
import { RewardDisplay } from '../../components/RewardDisplay';
import { Button } from '../../components/common/Button';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, language } = useThemeStore();
  const t = getTranslations(language);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title={t.navigation.home} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: theme.text }]}>{t.navigation.home}</Text>
        <Text style={[styles.subheader, { color: theme.textSecondary }]}>
          {t.reports.uploadReport}
        </Text>

        <RewardDisplay balance={0} pendingRewards={0} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            {t.common.quickActions || 'Quick Actions'}
          </Text>
          <Button
            title={`📸 ${t.reports.uploadReport || 'Submit New Report'}`}
            onPress={() => navigation.jumpTo('Upload')}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title={`📋 ${t.reports.reportHistory || 'View My Reports'}`}
            onPress={() => navigation.jumpTo('Reports')}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            How It Works
          </Text>
          <StepItem 
            number={1} 
            text="Take photos/videos of illegal mining"
            color={theme.primary}
            textColor={theme.text}
            numberBgColor={theme.primary}
          />
          <StepItem 
            number={2} 
            text="Add location and description"
            color={theme.primary}
            textColor={theme.text}
            numberBgColor={theme.primary}
          />
          <StepItem 
            number={3} 
            text="Submit report to blockchain"
            color={theme.primary}
            textColor={theme.text}
            numberBgColor={theme.primary}
          />
          <StepItem 
            number={4} 
            text="Admin reviews your report"
            color={theme.primary}
            textColor={theme.text}
            numberBgColor={theme.primary}
          />
          <StepItem 
            number={5} 
            text="Receive reward tokens!"
            color={theme.primary}
            textColor={theme.text}
            numberBgColor={theme.primary}
          />
        </View>

        {/* Footer - appears at end of scroll */}
        <Footer companyName="Gourav Kumar Ojha" />
      </ScrollView>
    </View>
  );
};

const StepItem: React.FC<{ 
  number: number
  text: string
  color: string
  textColor: string
  numberBgColor: string
}> = ({ number, text, color, textColor, numberBgColor }) => (
  <View style={styles.stepItem}>
    <View style={[styles.stepNumber, { backgroundColor: numberBgColor }]}>
      <Text style={[styles.stepNumberText, { color: '#FFF' }]}>{number}</Text>
    </View>
    <Text style={[styles.stepText, { color: textColor }]}>{text}</Text>
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
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheader: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  actionButton: {
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
