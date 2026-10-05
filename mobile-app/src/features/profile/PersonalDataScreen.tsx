import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/tokens';
import {
  ArrowLeftIcon,
  BellIcon,
  UserIcon,
  VenusMarsIcon,
  TabletIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EditIcon,
  PencilIcon,
  CheckIcon,
} from '../../components/icons/AuthIcons';
import {
  PersonalDataForm,
  formatUkrainianDate,
  formatGender,
  parseGender,
  formatPhoneDisplay,
  sanitizePersonalData,
} from './personal_data_utils';

export interface PersonalDataScreenProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onSave?: (data: PersonalDataForm) => void;
  onToast?: (message: string) => void;
  initialData?: Partial<PersonalDataForm>;
}

export const PersonalDataScreen: React.FC<PersonalDataScreenProps> = ({
  onBack,
  onNotificationPress,
  onSave,
  onToast,
  initialData,
}) => {
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState<PersonalDataForm>(() =>
    sanitizePersonalData(initialData)
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;
        const sessionUser = sessionData?.session?.user;

        if (!currentUserId || !isMounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        if (!isMounted) return;

        const userMeta = sessionUser?.user_metadata;
        const resolvedName = profile?.full_name || userMeta?.full_name || '';
        const rawEmail = profile?.email || sessionUser?.email || '';
        const resolvedEmail = rawEmail.endsWith('@phone.stylingtooth.app') ? '' : rawEmail;
        const resolvedPhone = profile?.phone || userMeta?.phone || '';
        const rawAvatar =
          profile?.avatar_url ||
          userMeta?.avatar_url ||
          userMeta?.picture ||
          null;

        const resolvedAvatar =
          rawAvatar &&
          typeof rawAvatar === 'string' &&
          rawAvatar.trim() &&
          rawAvatar.trim() !== 'null' &&
          rawAvatar.trim() !== 'undefined'
            ? rawAvatar.trim()
            : null;

        const isPhoneConfirmed = Boolean(
          profile?.phone_confirmed ||
          userMeta?.phone_confirmed ||
          (profile?.phone && profile?.telegram_chat_id)
        );

        const isEmailConfirmed = Boolean(
          profile?.email_confirmed ||
          sessionUser?.email_confirmed_at
        );

        const resolvedGender = parseGender(profile?.gender || userMeta?.gender || '');
        const resolvedBirthDate = profile?.birth_date || userMeta?.birth_date || '';

        setFormData((prev) =>
          sanitizePersonalData({
            ...prev,
            fullName: resolvedName || prev.fullName,
            email: resolvedEmail || prev.email,
            phone: resolvedPhone || prev.phone,
            gender: resolvedGender || prev.gender,
            isPhoneVerified: isPhoneConfirmed || prev.isPhoneVerified,
            isEmailVerified: isEmailConfirmed || prev.isEmailVerified,
            avatarUrl: resolvedAvatar || prev.avatarUrl,
            birthDate: resolvedBirthDate || prev.birthDate,
          })
        );
      } catch {
      }
    }

    if (!initialData) {
      loadUserData();
    } else {
      setFormData(sanitizePersonalData(initialData));
    }

    return () => {
      isMounted = false;
    };
  }, [initialData]);

  const showFeedback = (message: string) => {
    if (onToast) {
      onToast(message);
    } else {
      Alert.alert('Повідомлення', message);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setFormData((prev) => ({ ...prev, avatarUrl: pickedUri }));
        showFeedback('Аватар оновлено');
      }
    } catch {
      showFeedback('Помилка вибору фотографії');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            avatar_url: formData.avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUserId);

        await supabase.auth.updateUser({
          data: {
            full_name: formData.fullName,
            birth_date: formData.birthDate,
            gender: formData.gender,
          },
        });
      }

      if (onSave) {
        onSave(formData);
      }

      setIsEditingName(false);
      setIsEditingGender(false);
      setIsEditingPhone(false);
      setIsEditingEmail(false);
      setIsEditingBirthDate(false);

      showFeedback('Зміни успішно збережено');
    } catch {
      showFeedback('Помилка збереження даних');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container} testID="personal-data-screen">
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top + 8, 20) },
        ]}
      >
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          testID="personal-data-back-button"
        >
          <ArrowLeftIcon color={colors.contentPrimary} size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} testID="personal-data-title">
          Особисті дані
        </Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Сповіщення"
          testID="personal-data-bell-button"
        >
          <BellIcon color={colors.contentPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection} testID="avatar-container">
          <View style={styles.avatarRing}>
            {formData.avatarUrl ? (
              <Image
                source={{ uri: formData.avatarUrl }}
                style={styles.avatarImage}
                testID="avatar-image"
              />
            ) : (
              <View style={styles.avatarPlaceholder} testID="avatar-placeholder">
                <UserIcon color={colors.softBlue} size={48} />
              </View>
            )}

            <TouchableOpacity
              style={styles.avatarEditButton}
              onPress={handlePickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Змінити аватар"
              testID="avatar-edit-button"
            >
              <EditIcon color={colors.surfaceWhite} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formCard} testID="personal-data-card">
          <View style={styles.formRow} testID="fullname-row">
            <View style={styles.rowIconContainer}>
              <UserIcon color={colors.contentPrimary} size={20} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Ім'я та Прізвище</Text>
              {isEditingName ? (
                <TextInput
                  style={styles.rowInput}
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, fullName: text }))
                  }
                  placeholder="Вкажіть ваше ім'я"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  testID="fullname-input"
                />
              ) : (
                <Text
                  style={[
                    styles.rowValue,
                    !formData.fullName && styles.rowValuePlaceholder,
                  ]}
                  testID="fullname-display-value"
                >
                  {formData.fullName || "Вкажіть ваше ім'я"}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.rowActionButton}
              onPress={() => setIsEditingName(!isEditingName)}
              accessibilityRole="button"
              accessibilityLabel="Редагувати ім'я"
              testID="edit-fullname-button"
            >
              {isEditingName ? (
                <CheckIcon color={colors.terracotta} size={16} />
              ) : (
                <PencilIcon color={colors.contentPrimary} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.formRow} testID="gender-row">
            <View style={styles.rowIconContainer}>
              <VenusMarsIcon color={colors.contentPrimary} size={20} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Стать</Text>
              {isEditingGender ? (
                <View style={styles.genderOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderChip,
                      formData.gender === 'female' && styles.genderChipActive,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, gender: 'female' }));
                      setIsEditingGender(false);
                    }}
                    testID="gender-option-female"
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        formData.gender === 'female' &&
                          styles.genderChipTextActive,
                      ]}
                    >
                      Жіноча
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderChip,
                      formData.gender === 'male' && styles.genderChipActive,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, gender: 'male' }));
                      setIsEditingGender(false);
                    }}
                    testID="gender-option-male"
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        formData.gender === 'male' && styles.genderChipTextActive,
                      ]}
                    >
                      Чоловіча
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderChip,
                      formData.gender === 'other' && styles.genderChipActive,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, gender: 'other' }));
                      setIsEditingGender(false);
                    }}
                    testID="gender-option-other"
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        formData.gender === 'other' &&
                          styles.genderChipTextActive,
                      ]}
                    >
                      Інше
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text
                  style={[
                    styles.rowValue,
                    !formData.gender && styles.rowValuePlaceholder,
                  ]}
                  testID="gender-display-value"
                >
                  {formatGender(formData.gender)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.rowActionButton}
              onPress={() => setIsEditingGender(!isEditingGender)}
              accessibilityRole="button"
              accessibilityLabel="Редагувати стать"
              testID="edit-gender-button"
            >
              {isEditingGender ? (
                <CheckIcon color={colors.terracotta} size={16} />
              ) : (
                <PencilIcon color={colors.contentPrimary} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.formRow} testID="phone-row">
            <View style={styles.rowIconContainer}>
              <TabletIcon color={colors.contentPrimary} size={20} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Номер телефону</Text>
              {isEditingPhone ? (
                <TextInput
                  style={styles.rowInput}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, phone: text }))
                  }
                  placeholder="+380..."
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  autoFocus
                  testID="phone-input"
                />
              ) : (
                <Text
                  style={[
                    styles.rowValue,
                    !formData.phone && styles.rowValuePlaceholder,
                  ]}
                  testID="phone-display-value"
                >
                  {formatPhoneDisplay(formData.phone) || 'Не вказано'}
                </Text>
              )}
            </View>
            {formData.isPhoneVerified && !isEditingPhone && (
              <View style={styles.verifiedBadge} testID="phone-verified-badge">
                <CheckIcon color="#16A34A" size={12} />
                <Text style={styles.verifiedBadgeText}>Підтверджено</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.rowActionButton}
              onPress={() => setIsEditingPhone(!isEditingPhone)}
              accessibilityRole="button"
              accessibilityLabel="Редагувати телефон"
              testID="edit-phone-button"
            >
              {isEditingPhone ? (
                <CheckIcon color={colors.terracotta} size={16} />
              ) : (
                <PencilIcon color={colors.contentPrimary} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.formRow} testID="email-row">
            <View style={styles.rowIconContainer}>
              <EnvelopeIcon color={colors.contentPrimary} size={20} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Електронна пошта</Text>
              {isEditingEmail ? (
                <TextInput
                  style={styles.rowInput}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  testID="email-input"
                />
              ) : (
                <Text
                  style={[
                    styles.rowValue,
                    !formData.email && styles.rowValuePlaceholder,
                  ]}
                  testID="email-display-value"
                >
                  {formData.email || 'Не вказано'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.rowActionButton}
              onPress={() => setIsEditingEmail(!isEditingEmail)}
              accessibilityRole="button"
              accessibilityLabel="Редагувати пошту"
              testID="edit-email-button"
            >
              {isEditingEmail ? (
                <CheckIcon color={colors.terracotta} size={16} />
              ) : (
                <PencilIcon color={colors.contentPrimary} size={18} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.formRow} testID="birthdate-row">
            <View style={styles.rowIconContainer}>
              <CalendarIcon color={colors.contentPrimary} size={20} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Дата народження</Text>
              {isEditingBirthDate ? (
                <TextInput
                  style={styles.rowInput}
                  value={formData.birthDate}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, birthDate: text }))
                  }
                  placeholder="РРРР-ММ-ДД або ДД.ММ.РРРР"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  testID="birthdate-input"
                />
              ) : (
                <Text
                  style={[
                    styles.rowValue,
                    !formData.birthDate && styles.rowValuePlaceholder,
                  ]}
                  testID="birthdate-display-value"
                >
                  {formatUkrainianDate(formData.birthDate)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.rowActionButton}
              onPress={() => setIsEditingBirthDate(!isEditingBirthDate)}
              accessibilityRole="button"
              accessibilityLabel="Редагувати дату народження"
              testID="edit-birthdate-button"
            >
              {isEditingBirthDate ? (
                <CheckIcon color={colors.terracotta} size={16} />
              ) : (
                <PencilIcon color={colors.contentPrimary} size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.securityCard} testID="security-guarantee-note">
          <View style={styles.securityIconContainer}>
            <ShieldCheckIcon color={colors.contentPrimary} size={22} />
          </View>
          <Text style={styles.securityText}>
            Ваші контактні дані використовуються для підтвердження бронювань та
            сповіщень про візити. Ми гарантуємо їх безпеку.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Зберегти зміни"
          testID="save-personal-data-button"
        >
          {isSaving ? (
            <ActivityIndicator color={colors.surfaceWhite} />
          ) : (
            <Text style={styles.saveButtonText}>Зберегти зміни</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.softIce,
    position: 'relative',
  },
  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.softIce,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  formCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: '#71717A',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.contentPrimary,
  },
  rowValuePlaceholder: {
    color: colors.textMuted,
  },
  rowInput: {
    fontSize: 16,
    color: colors.contentPrimary,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.terracotta,
  },
  rowActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F0F2F5',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  verifiedBadgeText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginLeft: 4,
  },
  genderOptionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  genderChipActive: {
    backgroundColor: colors.terracotta,
  },
  genderChipText: {
    fontSize: 13,
    color: colors.contentPrimary,
    fontWeight: '500',
  },
  genderChipTextActive: {
    color: colors.surfaceWhite,
    fontWeight: '600',
  },
  securityCard: {
    backgroundColor: colors.visitGray,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.contentPrimary,
  },
  saveButton: {
    backgroundColor: colors.terracotta,
    height: 48,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surfaceWhite,
  },
});
