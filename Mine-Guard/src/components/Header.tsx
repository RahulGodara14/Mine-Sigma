import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { getTranslations } from '../services/i18n/translations';

interface HeaderProps {
  title?: string;
  showLanguageToggle?: boolean;
  showThemeToggle?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  subtitle?: string;
}

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 64;

export const Header: React.FC<HeaderProps> = ({
  title,
  showLanguageToggle = true,
  showThemeToggle = true,
  showBack = false,
  onBackPress,
  rightComponent,
  subtitle,
}) => {
  const { theme, isDark, toggleTheme, language, setLanguage } = useThemeStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleThemeWithAnimation = () => {
    animatePress();
    Animated.timing(rotateAnim, {
      toValue: isDark ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    toggleTheme();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const languages = [
    { code: 'en', name: 'English', icon: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', icon: '🇮🇳' },
    { code: 'hinglish', name: 'Hinglish', icon: '🇮🇳' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.headerBg }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.logo}>
              <View
                style={[
                  styles.shield,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.secondary,
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.logoText, { color: theme.text }]}>Guard</Text>
            </View>
          )}
        </View>

        {/* Center Section */}
        {title && (
          <View style={styles.centerSection}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Right Section */}
        <View style={styles.rightSection}>
          {showThemeToggle && (
            <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate }] }}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleThemeWithAnimation}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isDark ? 'sunny' : 'moon'}
                  size={22}
                  color={isDark ? '#FDB022' : '#6B7280'}
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {showLanguageToggle && (
            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowLanguageMenu(!showLanguageMenu)}
                activeOpacity={0.7}
              >
                <Ionicons name="language" size={22} color={theme.primary} />
              </TouchableOpacity>

              {showLanguageMenu && (
                <View
                  style={[
                    styles.languageMenu,
                    { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
                  ]}
                >
                  {languages.map((lang: any) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        {
                          backgroundColor:
                            language === lang.code ? theme.primary + '20' : 'transparent',
                          borderBottomColor: theme.borderColor,
                        },
                      ]}
                      onPress={() => {
                        setLanguage(lang.code as any);
                        setShowLanguageMenu(false);
                      }}
                    >
                      <Text style={styles.languageEmoji}>{lang.icon}</Text>
                      <Text
                        style={[
                          styles.languageText,
                          {
                            color:
                              language === lang.code
                                ? theme.primary
                                : theme.textSecondary,
                            fontWeight: language === lang.code ? '600' : '400',
                          },
                        ]}
                      >
                        {lang.name}
                      </Text>
                      {language === lang.code && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={theme.primary}
                          style={{ marginLeft: 'auto' }}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {rightComponent && rightComponent}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shield: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageContainer: {
    position: 'relative',
  },
  languageMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  languageEmoji: {
    fontSize: 18,
  },
  languageText: {
    fontSize: 13,
    flex: 1,
  },
});
