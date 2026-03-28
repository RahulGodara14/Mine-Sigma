import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  LinearGradient,
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
import { web3Service } from '../../services/blockchain/web3Service';
import { getTranslations } from '../../services/i18n/translations';

const { height, width } = Dimensions.get('window');

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [walletAddress, setWalletAddressState] = useState('');

  const { setJwtToken, setUserId, setWalletAddress, setRole, setEmail: setStoreEmail } = useAuthStore();
  const { theme: themeColors, isDark, language } = useThemeStore();
  const t = getTranslations(language);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const emailInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordInputAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

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

  const handleNextStep = () => {
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        Alert.alert(t.common.error, t.auth.emailRequired);
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert(t.common.error, t.auth.invalidEmail);
        return;
      }

      if (password.length < 6) {
        Alert.alert(t.common.error, 'Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(t.common.error, t.auth.passwordMismatch);
        return;
      }

      setStep(2);
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const address = await web3Service.connectMetaMask();
      setWalletAddressState(address);
      setStep(3);
    } catch (error) {
      Alert.alert(t.common.error, 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    setLoading(true);
    try {
      const response = await authService.signup({
        email,
        password,
        walletAddress: walletAddress,
        shareProfile: false,
      });

      if (response.token) {
        setJwtToken(response.token);
        setUserId(response.user.id);
        setWalletAddress(response.user.walletAddress || walletAddress);
        setStoreEmail(response.user.email || email);
        setRole((response.user.role as any) || 'citizen');
        Alert.alert(t.common.success, t.auth.signupSuccess);
      }
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const renderStep1 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((num) => (
          <View key={num} style={styles.stepItem}>
            <Animated.View
              style={[
                styles.stepNumber,
                {
                  backgroundColor:
                    step >= num ? themeColors.primary : themeColors.borderColor,
                  transform: num === step ? [{ scale: pulseScale }] : [],
                },
              ]}
            >
              {step > num ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={styles.stepNumberText}>{num}</Text>
              )}
            </Animated.View>
            {num < 3 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor:
                      step > num ? themeColors.primary : themeColors.borderColor,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <Text style={[styles.stepTitle, { color: themeColors.text }]}>
        {t.auth.createAccount}
      </Text>
      <Text style={[styles.stepSubtitle, { color: themeColors.textSecondary }]}>
        Step 1 of 3: Login Credentials
      </Text>

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

      <Animated.View
        style={[
          styles.inputWrapper,
          {
            transform: [{ scale: confirmPasswordInputAnim.interpolate({
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
              borderColor: confirmPasswordFocused ? themeColors.primary : themeColors.inputBorder,
              borderWidth: confirmPasswordFocused ? 2 : 1,
            },
          ]}
        >
          <Ionicons name="lock-closed" size={20} color={themeColors.primary} />
          <TextInput
            style={[styles.input, { color: themeColors.text }]}
            placeholder={t.auth.enterConfirmPassword}
            placeholderTextColor={themeColors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            onFocus={() => {
              setConfirmPasswordFocused(true);
              handleInputFocus(confirmPasswordInputAnim);
            }}
            onBlur={() => {
              setConfirmPasswordFocused(false);
              handleInputBlur(confirmPasswordInputAnim);
            }}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color={themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: themeColors.primary,
          },
        ]}
        onPress={handleNextStep}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{t.common.next}</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.footerLink}>
        <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
          {t.auth.alreadyHaveAccount}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.footerLinkText, { color: themeColors.primary }]}>
            {t.auth.login}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((num) => (
          <View key={num} style={styles.stepItem}>
            <Animated.View
              style={[
                styles.stepNumber,
                {
                  backgroundColor:
                    step >= num ? themeColors.primary : themeColors.borderColor,
                },
              ]}
            >
              {step > num ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={styles.stepNumberText}>{num}</Text>
              )}
            </Animated.View>
            {num < 3 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor:
                      step > num ? themeColors.primary : themeColors.borderColor,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <Text style={[styles.stepTitle, { color: themeColors.text }]}>
        Connect Your Wallet
      </Text>
      <Text style={[styles.stepSubtitle, { color: themeColors.textSecondary }]}>
        Step 2 of 3: Link your cryptocurrency wallet
      </Text>

      <View
        style={[
          styles.walletCard,
          {
            backgroundColor: themeColors.cardBg,
            borderColor: themeColors.borderColor,
          },
        ]}
      >
        <Ionicons name="wallet" size={48} color={themeColors.primary} />
        <Text style={[styles.walletCardTitle, { color: themeColors.text }]}>
          Connect Wallet
        </Text>
        <Text style={[styles.walletCardText, { color: themeColors.textSecondary }]}>
          Link your MetaMask or any Web3 wallet to submit reports on blockchain
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.walletButton,
          {
            backgroundColor: themeColors.secondary,
          },
        ]}
        onPress={handleConnectWallet}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="wallet-outline" size={20} color="#FFF" />
            <Text style={styles.walletButtonText}>Connect MetaMask</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          setWalletAddressState('0x0000000000000000000000000000000000000000');
          setStep(3);
        }}
        disabled={loading}
      >
        <Text style={[styles.skipButtonText, { color: themeColors.primary }]}>
          Skip for now
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map((num) => (
          <View key={num} style={styles.stepItem}>
            <Animated.View
              style={[
                styles.stepNumber,
                {
                  backgroundColor:
                    step >= num ? themeColors.primary : themeColors.borderColor,
                },
              ]}
            >
              {step > num ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={styles.stepNumberText}>{num}</Text>
              )}
            </Animated.View>
            {num < 3 && (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor:
                      step > num ? themeColors.primary : themeColors.borderColor,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      <Text style={[styles.stepTitle, { color: themeColors.text }]}>
        Review & Confirm
      </Text>
      <Text style={[styles.stepSubtitle, { color: themeColors.textSecondary }]}>
        Step 3 of 3: Complete your signup
      </Text>

      <View
        style={[
          styles.reviewCard,
          {
            backgroundColor: themeColors.cardBg,
            borderColor: themeColors.borderColor,
          },
        ]}
      >
        <View style={styles.reviewItem}>
          <Text style={[styles.reviewLabel, { color: themeColors.textSecondary }]}>
            Email
          </Text>
          <Text style={[styles.reviewValue, { color: themeColors.text }]}>
            {email}
          </Text>
        </View>

        {walletAddress !== '0x0000000000000000000000000000000000000000' && (
          <View style={styles.reviewItem}>
            <Text style={[styles.reviewLabel, { color: themeColors.textSecondary }]}>
              Wallet Address
            </Text>
            <Text style={[styles.reviewValue, { color: themeColors.text }]}>
              {walletAddress.substring(0, 10)}...
              {walletAddress.substring(walletAddress.length - 8)}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: themeColors.primary,
          },
        ]}
        onPress={handleCompleteSignup}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Text style={styles.buttonText}>{t.common.submit}</Text>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Header title={t.auth.signup} showBack={step > 1} onBackPress={handleBackPress} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

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
  stepContainer: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepLine: {
    height: 3,
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
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
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
  },
  footerLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  walletCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  walletCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  walletCardText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  skipButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
