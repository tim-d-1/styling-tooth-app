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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { colors, radii } from '../../theme/tokens';
import {
  validateRegisterForm,
  isEmailIdentifier,
  normalizePhoneNumber,
  phoneToAuthEmail,
} from './register_utils';
import { parseOAuthRedirectUrl } from './login_utils';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  GlobeIcon,
  PictureIcon,
} from '../../components/icons/AuthIcons';

WebBrowser.maybeCompleteAuthSession();

export interface RegisterScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
  defaultCity?: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onSuccess,
  onNavigateLogin,
  defaultCity = 'м. Київ',
}) => {
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState(defaultCity);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
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

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Потрібен дозвіл на доступ до галереї');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      setErrorMessage('Помилка вибору фотографії');
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const redirectUrl = makeRedirectUri({
        scheme: 'stylingtooth',
        path: 'auth/callback',
      });

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

    const validation = validateRegisterForm({
      firstName,
      lastName,
      identifier,
      password,
      city,
      avatarUri,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsLoading(true);
      const trimmedIdentifier = identifier.trim();
      const isEmail = isEmailIdentifier(trimmedIdentifier);
      const normalizedPhone = normalizePhoneNumber(trimmedIdentifier);

      const metadata: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        city: city.trim(),
        phone: isEmail ? undefined : normalizedPhone,
      };

      let signUpResult;
      if (isEmail) {
        signUpResult = await supabase.auth.signUp({
          email: trimmedIdentifier,
          password,
          options: {
            data: metadata,
          },
        });
      } else if (normalizedPhone) {
        signUpResult = await supabase.auth.signUp({
          phone: normalizedPhone,
          password,
          options: {
            data: metadata,
          },
        });

        if (
          signUpResult.error &&
          (signUpResult.error.message.toLowerCase().includes('disabled') ||
            signUpResult.error.message.toLowerCase().includes('provider') ||
            signUpResult.error.message.toLowerCase().includes('phone signups') ||
            signUpResult.error.message.toLowerCase().includes('otp'))
        ) {
          const authEmail = phoneToAuthEmail(normalizedPhone);
          signUpResult = await supabase.auth.signUp({
            email: authEmail,
            password,
            options: {
              data: {
                ...metadata,
                phone: normalizedPhone,
              },
            },
          });
        }
      } else {
        setErrorMessage('Введіть коректний Email або номер телефону');
        return;
      }

      if (signUpResult.error) {
        setErrorMessage(signUpResult.error.message);
        return;
      }

      const registeredUser = signUpResult.data?.user;
      if (
        registeredUser &&
        Array.isArray(registeredUser.identities) &&
        registeredUser.identities.length === 0
      ) {
        setErrorMessage(
          'Користувач із цією електронною адресою вже існує. Будь ласка, увійдіть.'
        );
        return;
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Помилка реєстрації';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safeArea} testID="register-screen">
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

          <View style={styles.headerContainer}>
            <Text style={styles.pageTitle}>Реєстрація</Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer} testID="register-error-message">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ІМ’Я</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                testID="first-name-input"
                accessibilityLabel="Ім’я"
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ПРІЗВИЩЕ</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                testID="last-name-input"
                accessibilityLabel="Прізвище"
              />
              <View style={styles.inputLine} />
            </View>

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
                  accessibilityLabel={
                    showPassword ? 'Приховати пароль' : 'Показати пароль'
                  }
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>МІСТО</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                testID="city-input"
                accessibilityLabel="Місто"
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.avatarGroup}>
              <Text style={styles.inputLabel}>ФОТО ПРОФІЛЮ</Text>
              <TouchableOpacity
                style={styles.avatarPicker}
                onPress={handlePickAvatar}
                accessibilityRole="button"
                accessibilityLabel="Обрати фото профілю"
                testID="avatar-picker-button"
              >
                {avatarUri ? (
                  <View style={styles.avatarPreviewContainer}>
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarPreviewImage}
                      testID="avatar-preview-image"
                    />
                    <TouchableOpacity
                      style={styles.removeAvatarBadge}
                      onPress={() => setAvatarUri(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Видалити фото"
                      testID="remove-avatar-button"
                    >
                      <Text style={styles.removeAvatarText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <PictureIcon color={colors.textMuted} size={28} />
                    <Text style={styles.avatarPlaceholderText}>
                      Натисніть, щоб обрати фото
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.spacer} />

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              accessibilityRole="button"
              accessibilityLabel="Вхід через Google"
              testID="google-register-button"
            >
              <GoogleIcon size={24} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Далі"
            testID="submit-register-button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surfaceCream} />
            ) : (
              <Text style={styles.submitButtonText}>Далі</Text>
            )}
          </TouchableOpacity>

          {onNavigateLogin ? (
            <TouchableOpacity
              style={styles.loginLinkButton}
              onPress={onNavigateLogin}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                language === 'UA'
                  ? 'Вже маєте акаунт? Увійти'
                  : 'Already have an account? Log in'
              }
              testID="navigate-login-button"
            >
              <Text style={styles.loginLinkText}>
                {language === 'UA'
                  ? 'Вже маєте акаунт? '
                  : 'Already have an account? '}
                <Text style={styles.loginLinkHighlight}>
                  {language === 'UA' ? 'Увійти →' : 'Log in →'}
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
    gap: 20,
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
  avatarGroup: {
    marginTop: 8,
  },
  avatarPicker: {
    height: 110,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  avatarPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeAvatarBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(36, 47, 53, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  spacer: {
    flex: 1,
    minHeight: 28,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 20,
    marginTop: 12,
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
  loginLinkButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  loginLinkHighlight: {
    color: colors.terracotta,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
