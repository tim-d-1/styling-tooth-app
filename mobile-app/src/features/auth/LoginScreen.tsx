import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../lib/supabase';
import { colors, radii } from '../../theme/tokens';
import {
  validateLoginForm,
  isEmailIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
  parseOAuthRedirectUrl,
} from './login_utils';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  GlobeIcon,
} from '../../components/icons/AuthIcons';

WebBrowser.maybeCompleteAuthSession();

export interface LoginScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateRegister?: () => void;
  defaultIdentifier?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onSuccess,
  onNavigateRegister,
  defaultIdentifier = '',
}) => {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'UA' | 'EN'>('UA');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'UA' ? 'EN' : 'UA'));
  };

  useEffect(() => {
    const handleUrl = async (url: string) => {
      const params = parseOAuthRedirectUrl(url);

      if (params.error) {
        setErrorMessage(params.error);
        return;
      }

      if (params.code) {
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(params.code);

        if (exchangeError) {
          setErrorMessage(exchangeError.message);
          return;
        }

        if (sessionData?.session) {
          onSuccess?.();
        }
      } else if (params.accessToken && params.refreshToken) {
        const { data: sessionData, error: setSessionError } =
          await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });

        if (setSessionError) {
          setErrorMessage(setSessionError.message);
          return;
        }

        if (sessionData?.session) {
          onSuccess?.();
        }
      }
    };

    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      sub.remove();
    };
  }, [onSuccess]);

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const redirectUrl = makeRedirectUri({
        scheme: 'stylingtooth',
        path: 'auth/callback',
      });

      console.log('[Auth] Google OAuth redirectUrl:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          const params = parseOAuthRedirectUrl(result.url);

          if (params.error) {
            setErrorMessage(params.error);
            return;
          }

          if (params.code) {
            const { data: sessionData, error: exchangeError } =
              await supabase.auth.exchangeCodeForSession(params.code);

            if (exchangeError) {
              setErrorMessage(exchangeError.message);
              return;
            }

            if (sessionData?.session) {
              onSuccess?.();
            }
          } else if (params.accessToken && params.refreshToken) {
            const { data: sessionData, error: setSessionError } =
              await supabase.auth.setSession({
                access_token: params.accessToken,
                refresh_token: params.refreshToken,
              });

            if (setSessionError) {
              setErrorMessage(setSessionError.message);
              return;
            }

            if (sessionData?.session) {
              onSuccess?.();
            }
          }
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Помилка авторизації через соціальну мережу';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const targetIdentifier = identifier.trim();
    const validation = validateLoginForm(targetIdentifier, password);
    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsLoading(true);
      const isEmail = isEmailIdentifier(targetIdentifier);
      const normalizedPhone = normalizePhoneNumber(targetIdentifier);

      let signedInUser = null;
      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetIdentifier,
          password,
        });

        if (error) {
          if (
            error.message.includes('Invalid login credentials') ||
            error.message.includes('invalid_grant')
          ) {
            setErrorMessage('Невірний логін або пароль');
          } else {
            setErrorMessage(error.message);
          }
          return;
        }
        signedInUser = data?.user ?? null;
      } else if (normalizedPhone) {
        let { data, error } = await supabase.auth.signInWithPassword({
          phone: normalizedPhone,
          password,
        });

        if (
          error &&
          (error.message.toLowerCase().includes('disabled') ||
            error.message.toLowerCase().includes('provider') ||
            error.message.toLowerCase().includes('unsupported') ||
            error.message.toLowerCase().includes('not allowed'))
        ) {
          const authEmail = phoneToAuthEmail(normalizedPhone);
          const fallbackRes = await supabase.auth.signInWithPassword({
            email: authEmail,
            password,
          });
          if (fallbackRes?.data?.user && !fallbackRes.error) {
            data = fallbackRes.data;
            error = null;
          }
        }

        if (error) {
          if (
            error.message.includes('Invalid login credentials') ||
            error.message.includes('invalid_grant') ||
            error.message.includes('User not found')
          ) {
            setErrorMessage('Невірний логін або пароль');
          } else {
            setErrorMessage(error.message);
          }
          return;
        }
        signedInUser = data?.user ?? null;
      } else {
        setErrorMessage('Введіть коректний Email або номер телефону');
        return;
      }

      if (signedInUser) {
        onSuccess?.();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Помилка входу в систему';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safeArea} testID="login-screen">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 8,
              paddingBottom: Math.max(insets.bottom, 20) + 16,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              testID="back-button"
              accessibilityRole="button"
              accessibilityLabel="Назад"
            >
              <ArrowLeftIcon color={colors.contentPrimary} size={20} />
            </TouchableOpacity>

            <Text style={styles.topBarTitle}>Стильний зубець</Text>

            <TouchableOpacity
              onPress={toggleLanguage}
              style={styles.languageContainer}
              accessibilityRole="button"
              accessibilityLabel="Змінити мову"
            >
              <GlobeIcon color={colors.textMuted} size={14} />
              <Text style={styles.languageText}>{language}</Text>
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Вхід</Text>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer} testID="login-error-message">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Email / Phone Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL/НОМЕР ТЕЛЕФОНУ</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="identifier-input"
                accessibilityLabel="Email або номер телефону"
              />
              <View style={styles.inputLine} />
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ПАРОЛЬ</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="password-input"
                  accessibilityLabel="Пароль"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                  testID="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOffIcon color={colors.textMuted} size={18} />
                  ) : (
                    <EyeIcon color={colors.textMuted} size={18} />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.inputLine} />
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Social Logins */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              accessibilityRole="button"
              accessibilityLabel="Вхід через Google"
              testID="google-login-button"
            >
              <GoogleIcon size={24} />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Далі"
            testID="submit-login-button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surfaceCream} />
            ) : (
              <Text style={styles.submitButtonText}>Далі</Text>
            )}
          </TouchableOpacity>

          {onNavigateRegister ? (
            <TouchableOpacity
              style={styles.registerLinkButton}
              onPress={onNavigateRegister}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                language === 'UA'
                  ? 'Ще не маєте акаунту? Зареєструватися'
                  : "Don't have an account? Register"
              }
              testID="navigate-register-button"
            >
              <Text style={styles.registerLinkText}>
                {language === 'UA'
                  ? 'Ще не маєте акаунту? '
                  : "Don't have an account? "}
                <Text style={styles.registerLinkHighlight}>
                  {language === 'UA' ? 'Зареєструватися →' : 'Register →'}
                </Text>
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.terracotta,
    letterSpacing: -0.2,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 36,
    justifyContent: 'flex-end',
  },
  languageText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.black,
    letterSpacing: -0.2,
  },
  errorContainer: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 56, 60, 0.08)',
    borderRadius: radii.sm,
  },
  errorText: {
    color: colors.statusError,
    fontSize: 13,
    fontWeight: '500',
  },
  formContainer: {
    gap: 22,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  input: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.contentPrimary,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    padding: 6,
  },
  inputLine: {
    height: 1,
    backgroundColor: colors.textMuted,
    marginTop: 2,
  },
  spacer: {
    flex: 1,
    minHeight: 36,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceCream,
  },
  submitButton: {
    height: 48,
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surfaceCream,
    fontSize: 16,
    fontWeight: '600',
  },
  registerLinkButton: {
    marginTop: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerLinkText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  registerLinkHighlight: {
    color: colors.terracotta,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
