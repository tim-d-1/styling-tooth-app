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
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme/tokens';
import {
  ArrowLeftIcon,
  BellIcon,
  PlusIcon,
  CheckIcon,
} from '../../components/icons/AuthIcons';
import { UserAddress } from './profile_types';
import {
  createEmptyUserAddress,
  sanitizeUserAddress,
  resolveAddressLabelBadge,
  validateUserAddress,
  isFigmaAddressPlaceholder,
} from './addresses_utils';

export interface MyAddressesScreenProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onSelectAddress?: (address: UserAddress) => void;
  onToast?: (message: string) => void;
  initialAddress?: Partial<UserAddress>;
}

export const MyAddressesScreen: React.FC<MyAddressesScreenProps> = ({
  onBack,
  onNotificationPress,
  onSelectAddress,
  onToast,
  initialAddress,
}) => {
  const insets = useSafeAreaInsets();

  const [address, setAddress] = useState<UserAddress>(() =>
    sanitizeUserAddress(initialAddress)
  );
  const [labels, setLabels] = useState<string[]>(['Дім', 'Офіс']);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAddressFromSupabase() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userMeta = sessionData?.session?.user?.user_metadata;
        if (!isMounted) return;

        const savedAddress = userMeta?.address || userMeta?.addresses?.[0];
        if (savedAddress && !initialAddress) {
          if (!isFigmaAddressPlaceholder(savedAddress)) {
            const sanitized = sanitizeUserAddress(savedAddress);
            setAddress(sanitized);
            if (sanitized.label && !labels.includes(sanitized.label)) {
              setLabels((prev) => [...prev, sanitized.label]);
            }
          }
        }
      } catch {
      }
    }

    if (!initialAddress) {
      loadAddressFromSupabase();
    }

    return () => {
      isMounted = false;
    };
  }, [initialAddress]);

  const showFeedback = (message: string) => {
    if (onToast) {
      onToast(message);
    } else {
      Alert.alert('Адреса', message);
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      showFeedback('Немає нових сповіщень');
    }
  };

  const handleAddLabelConfirm = () => {
    const trimmed = newLabelInput.trim();
    if (trimmed) {
      if (!labels.includes(trimmed)) {
        setLabels((prev) => [...prev, trimmed]);
      }
      setAddress((prev) => ({ ...prev, label: trimmed }));
      setNewLabelInput('');
      setIsAddingLabel(false);
    }
  };

  const handleSelectAddress = async () => {
    const validation = validateUserAddress(address);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Введіть коректну адресу');
      return;
    }
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const sanitized = sanitizeUserAddress(address);
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        await supabase.auth.updateUser({
          data: {
            address: sanitized,
            addresses: [sanitized],
          },
        });
      }

      if (onSelectAddress) {
        onSelectAddress(sanitized);
      }

      showFeedback('Адресу успішно збережено');
      if (onBack) {
        onBack();
      }
    } catch {
      showFeedback('Помилка збереження адреси');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container} testID="my-addresses-screen">
      <View
        style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}
        testID="addresses-header"
      >
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          testID="back-button"
        >
          <ArrowLeftIcon color={colors.contentPrimary} size={22} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Мої Адреси</Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Сповіщення"
          testID="notifications-button"
        >
          <BellIcon color={colors.contentPrimary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapCard} testID="pet-taxi-map-card">
          <Image
            source={require('../../../assets/images/pet-taxi-route-map.webp')}
            style={styles.mapImage}
            resizeMode="cover"
            accessibilityLabel="Маршрут Pet-таксі"
          />
        </View>

        <View style={styles.cardContainer} testID="address-details-card">
          <Text style={styles.cardTitle} testID="address-details-heading">
            Деталі адреси
          </Text>
          <Text style={styles.cardSubtitle} testID="address-details-subtitle">
            Для виклику Pet-таксі чи доставки косметики
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner} testID="address-error-banner">
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Вулиця та будинок</Text>
            <TextInput
              style={styles.textInput}
              value={address.street}
              onChangeText={(text) => {
                setAddress((prev) => ({ ...prev, street: text }));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Введіть вулицю та будинок"
              placeholderTextColor="#A0AEC0"
              accessibilityLabel="Вулиця та будинок"
              testID="address-street-input"
            />
          </View>

          <View style={styles.twoColumnRow}>
            <View style={[styles.fieldGroup, styles.columnLeft]}>
              <Text style={styles.fieldLabel}>Кв. / Офіс</Text>
              <TextInput
                style={styles.textInput}
                value={address.apartment}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, apartment: text }))
                }
                placeholder="42"
                placeholderTextColor="#A0AEC0"
                accessibilityLabel="Кв. / Офіс"
                testID="address-apartment-input"
              />
            </View>

            <View style={[styles.fieldGroup, styles.columnRight]}>
              <Text style={styles.fieldLabel}>Під'їзд / Поверх</Text>
              <TextInput
                style={styles.textInput}
                value={address.entranceFloor}
                onChangeText={(text) =>
                  setAddress((prev) => ({ ...prev, entranceFloor: text }))
                }
                placeholder="1 під'їзд, 3 пов."
                placeholderTextColor="#A0AEC0"
                accessibilityLabel="Під'їзд / Поверх"
                testID="address-entrance-floor-input"
              />
            </View>
          </View>

          <View style={styles.labelsSection}>
            <Text style={styles.labelsTitle} testID="address-label-heading">
              Назва адреси:
            </Text>
            <View style={styles.pillsRow}>
              {labels.map((lbl) => {
                const isSelected = address.label === lbl;
                return (
                  <TouchableOpacity
                    key={lbl}
                    style={[
                      styles.labelPill,
                      isSelected
                        ? styles.labelPillActive
                        : styles.labelPillInactive,
                    ]}
                    onPress={() => setAddress((prev) => ({ ...prev, label: lbl }))}
                    accessibilityRole="button"
                    accessibilityLabel={resolveAddressLabelBadge(lbl)}
                    testID={`address-label-pill-${lbl}`}
                  >
                    <Text
                      style={[
                        styles.labelPillText,
                        isSelected
                          ? styles.labelPillTextActive
                          : styles.labelPillTextInactive,
                      ]}
                    >
                      {resolveAddressLabelBadge(lbl)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.addLabelButton}
                onPress={() => setIsAddingLabel((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Додати назву адреси"
                testID="address-add-label-button"
              >
                <PlusIcon color={colors.contentPrimary} size={18} />
              </TouchableOpacity>
            </View>

            {isAddingLabel && (
              <View style={styles.inlineAddRow} testID="add-label-input-container">
                <TextInput
                  style={styles.inlineInput}
                  value={newLabelInput}
                  onChangeText={setNewLabelInput}
                  placeholder="Нова назва (напр. Дача)"
                  placeholderTextColor="#A0AEC0"
                  accessibilityLabel="Нова назва адреси"
                  testID="new-label-input"
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.confirmAddButton}
                  onPress={handleAddLabelConfirm}
                  accessibilityRole="button"
                  accessibilityLabel="Підтвердити додавання мітки"
                  testID="confirm-add-label-button"
                >
                  <Text style={styles.confirmAddButtonText}>Додати</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() =>
              setAddress((prev) => ({
                ...prev,
                isDefaultTransfer: !prev.isDefaultTransfer,
              }))
            }
            accessibilityRole="checkbox"
            accessibilityState={{ checked: address.isDefaultTransfer }}
            aria-checked={address.isDefaultTransfer}
            accessibilityLabel="Зробити основною адресою для трансферу"
            testID="address-default-transfer-checkbox"
          >
            <View
              style={[
                styles.checkboxBox,
                address.isDefaultTransfer && styles.checkboxBoxChecked,
              ]}
            >
              {address.isDefaultTransfer && (
                <CheckIcon color="#FFFFFF" size={14} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Зробити основною адресою для трансферу
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSelectAddress}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Обрати адресу"
            testID="select-address-button"
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Обрати адресу</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(244, 247, 251, 0.75)',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  scrollContent: {
    paddingTop: 0,
  },
  mapCard: {
    width: '100%',
    height: 310,
    backgroundColor: '#E6EEF8',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -26,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.contentPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#C53030',
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#718096',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.contentPrimary,
    backgroundColor: '#FFFFFF',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1.2,
  },
  labelsSection: {
    marginTop: 6,
    marginBottom: 20,
  },
  labelsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentPrimary,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  labelPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  labelPillActive: {
    backgroundColor: '#96B3E2',
  },
  labelPillInactive: {
    backgroundColor: '#ECEEF1',
  },
  labelPillText: {
    fontSize: 14,
  },
  labelPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  labelPillTextInactive: {
    color: colors.contentPrimary,
    fontWeight: '500',
  },
  addLabelButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.contentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.contentPrimary,
    backgroundColor: '#FFFFFF',
  },
  confirmAddButton: {
    backgroundColor: colors.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmAddButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 26,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#A0AEC0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxBoxChecked: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracotta,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.contentPrimary,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.terracotta,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
