import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
  PawIcon,
  BellIcon,
  EditIcon,
  PlusIcon,
  ExclamationIcon,
  AngleSmallRightIcon,
  CalendarIcon,
  StarIcon,
  CameraIcon,
} from '../../components/icons/AuthIcons';
import {
  PetDetail,
  PetSwitcherItem,
  CareScheduleItem,
  PetProcedureHistory,
} from './pet_types';
import {
  formatPetSubtitle,
  formatVisitsCount,
  getSpeciesEmoji,
  formatPetAge,
  formatDateToUkrainian,
  parseHealthNotes,
  isFigmaPetPlaceholder,
} from './pet_utils';

export interface MyPetScreenProps {
  onNavigateAddPet?: () => void;
  onNavigateBooking?: (petId?: string) => void;
  onNotificationPress?: () => void;
  onEditPetPress?: (petId: string) => void;
  onToast?: (message: string) => void;
  initialPets?: PetSwitcherItem[];
  initialPetDetail?: PetDetail | null;
  initialSchedule?: CareScheduleItem[];
  initialHistory?: PetProcedureHistory | null;
}

export const MyPetScreen: React.FC<MyPetScreenProps> = ({
  onNavigateAddPet,
  onNavigateBooking,
  onNotificationPress,
  onEditPetPress,
  onToast,
  initialPets,
  initialPetDetail,
  initialSchedule,
  initialHistory,
}) => {
  const insets = useSafeAreaInsets();

  const [petsList, setPetsList] = useState<PetSwitcherItem[]>(initialPets || []);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(
    initialPets && initialPets.length > 0 ? initialPets[0].id : null
  );
  const [petDetail, setPetDetail] = useState<PetDetail | null>(
    initialPetDetail !== undefined ? initialPetDetail : null
  );
  const [schedule, setSchedule] = useState<CareScheduleItem[]>(
    initialSchedule || []
  );
  const [history, setHistory] = useState<PetProcedureHistory | null>(
    initialHistory !== undefined ? initialHistory : null
  );
  const [isLoading, setIsLoading] = useState(
    initialPets === undefined && initialPetDetail === undefined
  );

  const showFeedback = (message: string) => {
    if (onToast) {
      onToast(message);
    } else {
      Alert.alert('Повідомлення', message);
    }
  };

  useEffect(() => {
    if (initialPets !== undefined) {
      setPetsList(initialPets);
      if (initialPets.length > 0 && !selectedPetId) {
        setSelectedPetId(initialPets[0].id);
      }
    }
  }, [initialPets]);

  useEffect(() => {
    if (initialPetDetail !== undefined) {
      setPetDetail(initialPetDetail);
    }
  }, [initialPetDetail]);

  useEffect(() => {
    if (initialSchedule !== undefined) {
      setSchedule(initialSchedule);
    }
  }, [initialSchedule]);

  useEffect(() => {
    if (initialHistory !== undefined) {
      setHistory(initialHistory);
    }
  }, [initialHistory]);

  useEffect(() => {
    let isMounted = true;

    async function loadPetsData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;
        if (!currentUserId || !isMounted) {
          setIsLoading(false);
          return;
        }

        const { data: dbPets } = await supabase
          .from('pets')
          .select('*')
          .eq('owner_id', currentUserId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (dbPets && dbPets.length > 0) {
          const switcherItems: PetSwitcherItem[] = dbPets.map((p, idx) => ({
            id: p.id,
            name: isFigmaPetPlaceholder(p.name) ? `Улюбленець ${idx + 1}` : p.name,
            species: p.species,
            isActive: idx === 0,
          }));

          const activeId = selectedPetId || switcherItems[0].id;
          setSelectedPetId(activeId);
          setPetsList(
            switcherItems.map((item) => ({
              ...item,
              isActive: item.id === activeId,
            }))
          );

          const currentPet = dbPets.find((p) => p.id === activeId) || dbPets[0];

          const { count: visitsCount } = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('pet_id', currentPet.id)
            .neq('status', 'cancelled');

          const { data: latestAppointment } = await supabase
            .from('appointments')
            .select(`
              id,
              starts_at,
              price,
              status,
              service:services(name),
              master:masters(display_name)
            `)
            .eq('pet_id', currentPet.id)
            .neq('status', 'cancelled')
            .order('starts_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: mediaItems } = await supabase
            .from('pet_media')
            .select('*')
            .eq('pet_id', currentPet.id)
            .order('created_at', { ascending: false });

          if (!isMounted) return;

          let beforeUrl: string | null = null;
          let afterUrl: string | null = null;
          let generalAvatarUrl: string | null = null;

          if (mediaItems && mediaItems.length > 0) {
            for (const item of mediaItems) {
              const { data: pubData } = supabase.storage
                .from('pet-media')
                .getPublicUrl(item.storage_path);
              const itemUrl = pubData?.publicUrl || null;

              if (item.photo_type === 'before' && !beforeUrl) {
                beforeUrl = itemUrl;
              } else if (item.photo_type === 'after' && !afterUrl) {
                afterUrl = itemUrl;
              } else if (item.photo_type === 'general' && !generalAvatarUrl) {
                generalAvatarUrl = itemUrl;
              }
            }
          }

          const totalVisits = visitsCount || 0;

          setPetDetail({
            id: currentPet.id,
            name: isFigmaPetPlaceholder(currentPet.name) ? 'Улюбленець' : currentPet.name,
            species: currentPet.species,
            breed: currentPet.breed || null,
            birthDate: currentPet.birth_date || null,
            ageFormatted: formatPetAge(currentPet.birth_date),
            weightKg: currentPet.weight_kg ? Number(currentPet.weight_kg) : null,
            behaviorNotes: currentPet.behavior_notes || null,
            medicalNotes: currentPet.medical_notes || null,
            avatarUrl: generalAvatarUrl || afterUrl || null,
            visitsCount: totalVisits,
            isVip: totalVisits >= 5,
          });

          const { data: scheduleData } = await supabase
            .from('pet_care_schedules')
            .select('*')
            .eq('pet_id', currentPet.id)
            .order('sort_order', { ascending: true });

          if (isMounted && scheduleData) {
            setSchedule(
              scheduleData.map((item: any) => ({
                id: item.id,
                title: item.title,
                badgeText: item.badge_text || 'Актуально',
                drugName: item.drug_name || undefined,
                validUntilFormatted: item.valid_until ? formatDateToUkrainian(item.valid_until) : undefined,
                iconName: item.icon_name || 'calendar',
              }))
            );
          }

          if (latestAppointment) {
            const srvObj = Array.isArray(latestAppointment.service)
              ? latestAppointment.service[0]
              : latestAppointment.service;
            const mstObj = Array.isArray(latestAppointment.master)
              ? latestAppointment.master[0]
              : latestAppointment.master;

            setHistory({
              id: latestAppointment.id,
              serviceTitle: srvObj?.name || 'СПА-комплекс',
              price: Number(latestAppointment.price) || 0,
              dateFormatted: formatDateToUkrainian(latestAppointment.starts_at),
              masterName: mstObj?.display_name || 'Майстер',
              tags: ['Стрижка', 'Купання', 'Ознаки алергії відсутні'],
              beforePhotoUrl: beforeUrl,
              afterPhotoUrl: afterUrl,
            });
          } else {
            setHistory(null);
          }
        } else {
          setPetsList([]);
          setPetDetail(null);
          setHistory(null);
          setSchedule([]);
        }
      } catch {
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (initialPets === undefined && initialPetDetail === undefined) {
      loadPetsData();
    }

    return () => {
      isMounted = false;
    };
  }, [initialPets, initialPetDetail, selectedPetId]);

  const handleSelectPet = (petId: string) => {
    setSelectedPetId(petId);
    setPetsList((prev) =>
      prev.map((pet) => ({
        ...pet,
        isActive: pet.id === petId,
      }))
    );
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
        setPetDetail((prev) => (prev ? { ...prev, avatarUrl: pickedUri } : null));
        showFeedback('Фото улюбленця оновлено');
      }
    } catch {
      showFeedback('Помилка вибору фотографії');
    }
  };

  const healthNotes = parseHealthNotes(
    petDetail?.medicalNotes,
    petDetail?.behaviorNotes
  );

  return (
    <View style={styles.container} testID="pets-tab-content">
      <View
        style={[
          styles.headerRow,
          { paddingTop: Math.max(insets.top, 16) + 8 },
        ]}
      >
        <Text style={styles.headerTitle} testID="pets-screen-title">
          Мої улюбленці
        </Text>

        <TouchableOpacity
          style={styles.bellButton}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Сповіщення"
          testID="pets-notifications-button"
        >
          <BellIcon color={colors.contentPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 70 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {petsList.length > 0 && (
          <View style={styles.switcherContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.switcherScroll}
              testID="pets-switcher-list"
            >
              {petsList.map((pet) => {
                const isActive = pet.id === selectedPetId || pet.isActive;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.switcherChip,
                      isActive && styles.switcherChipActive,
                    ]}
                    onPress={() => handleSelectPet(pet.id)}
                    accessibilityRole="button"
                    accessibilityLabel={pet.name}
                    testID={`pet-switcher-item-${pet.id}`}
                  >
                    <Text style={styles.speciesEmoji}>
                      {getSpeciesEmoji(pet.species)}
                    </Text>
                    <Text
                      style={[
                        styles.switcherChipText,
                        isActive && styles.switcherChipTextActive,
                      ]}
                    >
                      {pet.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.addPetChipButton}
                onPress={onNavigateAddPet}
                accessibilityRole="button"
                accessibilityLabel="Додати улюбленця"
                testID="add-pet-chip-button"
              >
                <PlusIcon color={colors.contentPrimary} size={16} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.terracotta} size="large" />
          </View>
        ) : petDetail ? (
          <>
            <View style={styles.profileCard} testID="pet-profile-card">
              <View style={styles.avatarSection}>
                <View style={styles.avatarRing}>
                  {petDetail.avatarUrl ? (
                    <Image
                      source={{ uri: petDetail.avatarUrl }}
                      style={styles.avatarImage}
                      testID="pet-avatar-image"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder} testID="default-pet-avatar">
                      <PawIcon color={colors.surfaceWhite} size={40} />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.avatarEditButton}
                    onPress={handlePickAvatar}
                    accessibilityRole="button"
                    accessibilityLabel="Змінити фото"
                    testID="pet-avatar-edit-button"
                  >
                    <EditIcon color={colors.surfaceWhite} size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.petName} testID="pet-profile-name">
                {petDetail.name}
              </Text>

              <Text style={styles.petSubtitle} testID="pet-profile-subtitle">
                {formatPetSubtitle(
                  petDetail.breed,
                  petDetail.ageFormatted,
                  petDetail.weightKg
                ) || (petDetail.species === 'cat' ? 'Кіт' : 'Собака')}
              </Text>

              <View style={styles.badgesRow}>
                <View style={styles.visitsBadge} testID="pet-visits-badge">
                  <Text style={styles.visitsBadgeText}>
                    🐾 {formatVisitsCount(petDetail.visitsCount)}
                  </Text>
                </View>

                {(petDetail.isVip || petDetail.visitsCount >= 5) && (
                  <View style={styles.vipBadge} testID="pet-vip-badge">
                    <StarIcon color={colors.terracotta} size={14} />
                    <Text style={styles.vipBadgeText}>VIP Клієнт</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actionsGroup}>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => onNavigateBooking && onNavigateBooking(petDetail.id)}
                accessibilityRole="button"
                accessibilityLabel="Записати на візит"
                testID="book-visit-button"
              >
                <Text style={styles.bookButtonText}>Записати на візит</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.recommendationsButton}
                onPress={() => showFeedback(`Рекомендації для ${petDetail.name}`)}
                accessibilityRole="button"
                accessibilityLabel="Рекомендації"
                testID="recommendations-button"
              >
                <Text style={styles.recommendationsButtonText}>Рекомендації</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card} testID="pet-health-alert-card">
              <View style={styles.cardHeader}>
                <View style={styles.exclamationCircle}>
                  <ExclamationIcon color={colors.terracotta} size={14} />
                </View>
                <Text style={styles.cardTitle}>Алергії та особливості</Text>
              </View>

              {healthNotes.length > 0 ? (
                <View style={styles.notesList}>
                  {healthNotes.map((note, idx) => (
                    <View key={idx} style={styles.noteItem}>
                      <Text style={styles.noteBullet}>•</Text>
                      <Text style={styles.noteText}>{note}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyNotesText}>
                  Особливості та алергії не вказані
                </Text>
              )}
            </View>

            <View style={styles.card} testID="pet-care-schedule-card">
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Графік обробок</Text>
                <AngleSmallRightIcon color={colors.softBlue} size={20} />
              </View>

              {schedule.length > 0 ? (
                <View style={styles.scheduleGrid}>
                  {schedule.map((item) => (
                    <View key={item.id} style={styles.scheduleItemCard}>
                      <View style={styles.scheduleTopRow}>
                        <View style={styles.scheduleTitleRow}>
                          <CalendarIcon color={colors.terracotta} size={16} />
                          <Text style={styles.scheduleItemTitle}>{item.title}</Text>
                        </View>
                        <View style={styles.scheduleBadge}>
                          <Text style={styles.scheduleBadgeText}>
                            {item.badgeText}
                          </Text>
                        </View>
                      </View>

                      {item.drugName && (
                        <Text style={styles.scheduleSubText}>
                          Препарат: {item.drugName}
                        </Text>
                      )}
                      {item.validUntilFormatted && (
                        <Text style={styles.scheduleSubText}>
                          Термін: {item.validUntilFormatted}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyScheduleContainer} testID="empty-care-schedule">
                  <View style={styles.emptyScheduleCircle}>
                    <CalendarIcon color={colors.terracotta} size={20} />
                  </View>
                  <Text style={styles.emptyScheduleTitle}>
                    Немає запланованих обробок
                  </Text>
                  <Text style={styles.emptyScheduleSubtitle}>
                    Графік вакцинацій та обробок оновлюється автоматично
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.card} testID="pet-procedure-history-card">
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Історія процедур</Text>
                <AngleSmallRightIcon color={colors.softBlue} size={20} />
              </View>

              {history ? (
                <View style={styles.historyContent}>
                  <View style={styles.historyMainRow}>
                    <View style={styles.historyServiceCol}>
                      <Text style={styles.historyServiceTitle}>
                        {history.serviceTitle}
                      </Text>
                      <Text style={styles.historyDateText}>
                        {history.dateFormatted} • {history.masterName}
                      </Text>
                    </View>
                    <Text style={styles.historyPriceText}>
                      {history.price} грн
                    </Text>
                  </View>

                  {history.tags && history.tags.length > 0 && (
                    <View style={styles.historyTagsRow}>
                      {history.tags.map((tag, idx) => (
                        <View key={idx} style={styles.historyTagChip}>
                          <Text style={styles.historyTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {(history.beforePhotoUrl || history.afterPhotoUrl) && (
                    <View style={styles.photosRow}>
                      {history.beforePhotoUrl && (
                        <View style={styles.photoContainer}>
                          <Image
                            source={{ uri: history.beforePhotoUrl }}
                            style={styles.procedurePhoto}
                            resizeMode="cover"
                          />
                          <View style={styles.photoTag}>
                            <Text style={styles.photoTagText}>До 📸</Text>
                          </View>
                        </View>
                      )}

                      {history.afterPhotoUrl && (
                        <View style={styles.photoContainer}>
                          <Image
                            source={{ uri: history.afterPhotoUrl }}
                            style={styles.procedurePhoto}
                            resizeMode="cover"
                          />
                          <View style={styles.photoTag}>
                            <Text style={styles.photoTagText}>Після ✨</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyHistoryContainer} testID="empty-procedure-history">
                  <CameraIcon color={colors.textMuted} size={24} />
                  <Text style={styles.emptyHistoryTitle}>
                    Ще немає історії процедур
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer} testID="empty-pets-container">
            <View style={styles.emptyIconCircle}>
              <PawIcon color={colors.softBlue} size={48} />
            </View>
            <Text style={styles.emptyTitle}>У вас ще немає доданих тваринок</Text>
            <Text style={styles.emptySubtitle}>
              Додайте свого улюбленця, щоб переглядати його профіль, історію процедур та
              графік догляду.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={onNavigateAddPet}
              accessibilityRole="button"
              accessibilityLabel="Додати улюбленця"
              testID="add-pet-cta-button"
            >
              <Text style={styles.emptyAddButtonText}>+ Додати улюбленця</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  switcherContainer: {
    marginBottom: 16,
  },
  switcherScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  switcherChipActive: {
    backgroundColor: colors.softBlue,
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  speciesEmoji: {
    fontSize: 16,
  },
  switcherChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentPrimary,
  },
  switcherChipTextActive: {
    color: colors.surfaceWhite,
  },
  addPetChipButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#242F35',
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.softBlue,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F3D45',
    position: 'relative',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F3D45',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  petName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.surfaceWhite,
    marginTop: 4,
  },
  petSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  visitsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  visitsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surfaceWhite,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 100, 58, 0.25)',
    borderWidth: 1,
    borderColor: colors.terracotta,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  vipBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.terracotta,
  },
  actionsGroup: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  bookButton: {
    backgroundColor: colors.terracotta,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surfaceWhite,
  },
  recommendationsButton: {
    backgroundColor: colors.softBlue,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surfaceWhite,
  },
  card: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exclamationCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteBullet: {
    fontSize: 14,
    color: colors.terracotta,
    fontWeight: '700',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.contentPrimary,
    lineHeight: 20,
  },
  emptyNotesText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  scheduleGrid: {
    gap: 10,
  },
  scheduleItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 4,
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentPrimary,
  },
  scheduleBadge: {
    backgroundColor: '#EBF3FB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scheduleBadgeText: {
    fontSize: 11,
    color: colors.softBlue,
    fontWeight: '600',
  },
  scheduleSubText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyScheduleContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyScheduleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF3FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyScheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentPrimary,
  },
  emptyScheduleSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  historyContent: {
    gap: 12,
  },
  historyMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyServiceCol: {
    flex: 1,
  },
  historyServiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  historyDateText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyPriceText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentPrimary,
  },
  historyTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  historyTagChip: {
    backgroundColor: '#EBF3FB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyTagText: {
    fontSize: 12,
    color: colors.contentPrimary,
    fontWeight: '500',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  photoContainer: {
    flex: 1,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  procedurePhoto: {
    width: '100%',
    height: '100%',
  },
  photoTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoTagText: {
    color: colors.surfaceWhite,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyHistoryContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyHistoryTitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EFFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: colors.terracotta,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surfaceWhite,
  },
});
