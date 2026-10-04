import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { colors, radii } from '../../theme/tokens';
import {
  validatePetRegisterForm,
  parsePetBirthDateInput,
  PetSpecies,
} from './pet_register_utils';
import {
  ArrowLeftIcon,
  GlobeIcon,
  PawIcon,
} from '../../components/icons/AuthIcons';

export interface PetOnboardingScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
  onSkip?: () => void;
}

export const PetOnboardingScreen: React.FC<PetOnboardingScreenProps> = ({
  onBack,
  onSuccess,
  onSkip,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [behaviorNotes, setBehaviorNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'UA' | 'EN'>('UA');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'UA' ? 'EN' : 'UA'));
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Потрібен дозвіл на доступ до галереї');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      setErrorMessage('Помилка вибору фотографії');
    }
  };

  const getCombinedBirthDate = (): string => {
    const d = birthDay.trim();
    const m = birthMonth.trim();
    const y = birthYear.trim();
    if (!d && !m && !y) return '';
    if (d && m && y) {
      const pad = (val: string) => (val.length === 1 ? `0${val}` : val);
      return `${pad(d)}.${pad(m)}.${y}`;
    }
    return [d, m, y].filter(Boolean).join('.');
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const combinedDate = getCombinedBirthDate();
    const validation = validatePetRegisterForm({
      name,
      species,
      birthDate: combinedDate,
      medicalNotes,
      behaviorNotes,
      photoUri,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error);
      return;
    }

    try {
      setIsLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        setErrorMessage('Необхідно авторизуватися для реєстрації тваринки');
        return;
      }

      const { dateString: normalizedBirthDate } =
        parsePetBirthDateInput(combinedDate);

      const { data: insertedPet, error: insertError } = await supabase
        .from('pets')
        .insert({
          owner_id: currentUserId,
          name: name.trim(),
          species,
          sex: 'unknown',
          birth_date: normalizedBirthDate,
          medical_notes: medicalNotes.trim() || null,
          behavior_notes: behaviorNotes.trim() || null,
        })
        .select()
        .maybeSingle();

      if (insertError) {
        setErrorMessage(insertError.message);
        return;
      }

      if (photoUri && insertedPet?.id) {
        try {
          const ext = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
          const storagePath = `${insertedPet.id}/${Date.now()}.${ext}`;

          await supabase.from('pet_media').insert({
            pet_id: insertedPet.id,
            storage_path: storagePath,
            photo_type: 'general',
            created_by: currentUserId,
          });
        } catch {
          void 0;
        }
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Помилка збереження даних тваринки';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.safeArea} testID="pet-onboarding-screen">
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
            <Text style={styles.pageTitle}>Реєстрація тваринки</Text>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer} testID="pet-error-message">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <View style={styles.speciesGroup}>
              <Text style={styles.inputLabel}>ТИП ТВАРИНИ</Text>
              <View style={styles.speciesRow}>
                <TouchableOpacity
                  style={[
                    styles.speciesButton,
                    species === 'cat' && styles.speciesButtonActive,
                  ]}
                  onPress={() => setSpecies('cat')}
                  accessibilityRole="button"
                  accessibilityLabel="Кіт"
                  testID="species-cat-button"
                >
                  <Text
                    style={[
                      styles.speciesButtonText,
                      species === 'cat' && styles.speciesButtonTextActive,
                    ]}
                  >
                    Кіт
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.speciesButton,
                    species === 'dog' && styles.speciesButtonActive,
                  ]}
                  onPress={() => setSpecies('dog')}
                  accessibilityRole="button"
                  accessibilityLabel="Собака"
                  testID="species-dog-button"
                >
                  <Text
                    style={[
                      styles.speciesButtonText,
                      species === 'dog' && styles.speciesButtonTextActive,
                    ]}
                  >
                    Собака
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>КЛИЧКА</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                testID="pet-name-input"
                accessibilityLabel="Кличка"
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.birthDateGroup}>
              <Text style={styles.inputLabel}>ДАТА НАРОДЖЕННЯ</Text>
              <View style={styles.birthDateRow}>
                <View style={styles.birthDateBoxSmall}>
                  <TextInput
                    style={styles.birthDateInput}
                    value={birthDay}
                    onChangeText={setBirthDay}
                    keyboardType="number-pad"
                    maxLength={2}
                    testID="birth-day-input"
                    accessibilityLabel="День народження"
                  />
                </View>

                <View style={styles.birthDateBoxMedium}>
                  <TextInput
                    style={styles.birthDateInput}
                    value={birthMonth}
                    onChangeText={setBirthMonth}
                    testID="birth-month-input"
                    accessibilityLabel="Місяць народження"
                  />
                </View>

                <View style={styles.birthDateBoxSmall}>
                  <TextInput
                    style={styles.birthDateInput}
                    value={birthYear}
                    onChangeText={setBirthYear}
                    keyboardType="number-pad"
                    maxLength={4}
                    testID="birth-year-input"
                    accessibilityLabel="Рік народження"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>АЛЕРГІЇ</Text>
              <TextInput
                style={styles.input}
                value={medicalNotes}
                onChangeText={setMedicalNotes}
                testID="medical-notes-input"
                accessibilityLabel="Алергії"
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ПОВЕДІНКОВІ НОТАТКИ</Text>
              <TextInput
                style={styles.input}
                value={behaviorNotes}
                onChangeText={setBehaviorNotes}
                testID="behavior-notes-input"
                accessibilityLabel="Поведінкові нотатки"
              />
              <View style={styles.inputLine} />
            </View>

            <View style={styles.avatarGroup}>
              <Text style={styles.inputLabel}>ФОТО ТВАРИНКИ</Text>
              <TouchableOpacity
                style={styles.avatarPicker}
                onPress={handlePickPhoto}
                accessibilityRole="button"
                accessibilityLabel="Обрати фото тваринки"
                testID="pet-photo-picker-button"
              >
                {photoUri ? (
                  <View style={styles.avatarPreviewContainer}>
                    <Image
                      source={{ uri: photoUri }}
                      style={styles.avatarPreviewImage}
                      testID="pet-photo-preview-image"
                    />
                    <TouchableOpacity
                      style={styles.removeAvatarBadge}
                      onPress={() => setPhotoUri(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Видалити фото"
                      testID="remove-pet-photo-button"
                    >
                      <Text style={styles.removeAvatarText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <PawIcon color={colors.textMuted} size={28} />
                    <Text style={styles.avatarPlaceholderText}>
                      Натисніть, щоб обрати фото
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.spacer} />

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
            testID="submit-pet-button"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surfaceCream} />
            ) : (
              <Text style={styles.submitButtonText}>Далі</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Пропустити"
            testID="skip-pet-button"
          >
            <Text style={styles.skipButtonText}>
              {language === 'UA' ? 'Пропустити' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
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
  speciesGroup: {
    marginBottom: 4,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  speciesButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  speciesButtonActive: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  speciesButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.contentPrimary,
  },
  speciesButtonTextActive: {
    color: colors.surfaceCream,
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
  inputLine: {
    height: 1,
    backgroundColor: colors.textMuted,
    marginTop: 2,
  },
  birthDateGroup: {
    marginBottom: 4,
  },
  birthDateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  birthDateBoxSmall: {
    width: 60,
    height: 44,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWhite,
  },
  birthDateBoxMedium: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWhite,
  },
  birthDateInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    color: colors.contentPrimary,
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
  submitButton: {
    height: 48,
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surfaceCream,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

export default PetOnboardingScreen;
