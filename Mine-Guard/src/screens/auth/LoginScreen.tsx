import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { globalStyles } from '../../styles/globalStyles';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { getTranslations } from '../../services/i18n/translations';

const { height, width } = Dimensions.get('window');

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setJwtToken, setUserId, setWalletAddress, setRole, setEmail: setStoreEmail } = useAuthStore();
  const { theme: themeColors, isDark, language } = useThemeStore();
  const t = getTranslations(language);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const emailInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInputFocus = (inputAnim: any) => {
    Animated.timing(inputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleInputBlur = (inputAnim: any) => {
    Animated.timing(inputAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.common.error, t.auth.emailRequired);
      return;
    }

    animateButtonPress();
    setLoading(true);

    try {
      const response = await authService.login({
        email,
        password,
      });

      setJwtToken(response.token);
      setUserId(response.user.id);
      setWalletAddress(response.user.walletAddress || '');
      setRole((response.user.role as any) || 'citizen');
      setStoreEmail(response.user.email || email);
      authService.setAuthHeader(response.token);

      Alert.alert(t.common.success, t.auth.loginSuccess);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Header title={t.auth.login} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View
                style={[
                  styles.logoBox,
                  {
                    backgroundColor: themeColors.primary + '20',
                    borderColor: themeColors.primary,
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={48} color={themeColors.primary} />
              </View>
              <Text style={[styles.appTitle, { color: themeColors.text }]}>
                {t.auth.login}
              </Text>
              <Text style={[styles.appSubtitle, { color: themeColors.textSecondary }]}>
                Welcome back to MineGuard
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Email Input */}
              <Animated.View
                style={[
                  styles.inputWrapper,
                  {
                    transform: [{ scale: emailInputAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02],
                    }) }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: emailFocused ? themeColors.primary : themeColors.inputBorder,
                      borderWidth: emailFocused ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons name="mail" size={20} color={themeColors.primary} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder={t.auth.enterEmail}
                    placeholderTextColor={themeColors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    onFocus={() => {
                      setEmailFocused(true);
                      handleInputFocus(emailInputAnim);
                    }}
                    onBlur={() => {
                      setEmailFocused(false);
                      handleInputBlur(emailInputAnim);
                    }}
                    editable={!loading}
                  />
                </View>
              </Animated.View>

              {/* Password Input */}
              <Animated.View
                style={[
                  styles.inputWrapper,
                  {
                    transform: [{ scale: passwordInputAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.02],
                    }) }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: passwordFocused ? themeColors.primary : themeColors.inputBorder,
                      borderWidth: passwordFocused ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={20} color={themeColors.primary} />
                  <TextInput
                    style={[styles.input, { color: themeColors.text }]}
                    placeholder={t.auth.enterPassword}
                    placeholderTextColor={themeColors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => {
                      setPasswordFocused(true);
                      handleInputFocus(passwordInputAnim);
                    }}
                    onBlur={() => {
                      setPasswordFocused(false);
                      handleInputBlur(passwordInputAnim);
                    }}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: themeColors.primary }]}>
                  {t.auth.forgotPassword}
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      backgroundColor: themeColors.primary,
                    },
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>{t.auth.login}</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: themeColors.borderColor },
                  ]}
                />
                <Text style={[styles.dividerText, { color: themeColors.textSecondary }]}>
                  {t.auth.orContinueWith}
                </Text>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: themeColors.borderColor },
                  ]}
                />
              </View>

              {/* Wallet Login Button */}
              <TouchableOpacity
                style={[
                  styles.walletButton,
                  {
                    backgroundColor: themeColors.secondary,
                  },
                ]}
                onPress={() => navigation.navigate('WalletLogin')}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.walletButtonText}>{t.auth.loginWithWallet}</Text>
                <Ionicons name="wallet" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Signup Link */}
            <View style={styles.signupSection}>
              <Text style={[styles.signupText, { color: themeColors.textSecondary }]}>
                {t.auth.dontHaveAccount}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[styles.signupLink, { color: themeColors.primary }]}>
                  {t.auth.signup}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer - appears at end of scroll */}
          <Footer companyName="Gourav Kumar Ojha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  formSection: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  walletButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  walletButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '400',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
