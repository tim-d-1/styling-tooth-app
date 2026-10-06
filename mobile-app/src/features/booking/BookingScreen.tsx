import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeftIcon,
  PawIcon,
  UserIcon,
  PencilIcon,
  PlusIcon,
  CreditCardIcon,
  CheckIcon,
} from '../../components/icons/AuthIcons';
import {
  ClockIcon,
  AngleSmallLeftIcon,
  ApplePayIcon,
  CashIcon,
} from './BookingIcons';
import { BookingProgressBar } from './BookingProgressBar';
import {
  BookingStage,
  BookingState,
  PetOption,
  ProcedureOption,
  MasterProfile,
  WeekDayOption,
  PROCEDURES_CATALOG,
  DEMO_PETS,
  TIME_SLOTS,
} from './booking_types';
import { getKyivISOString, getInitialBookingDate } from './booking_date_utils';
import { fetchPetsAvatarMap } from '../pets/pet_media_utils';

export interface BookingScreenProps {
  onBack?: () => void;
  onComplete?: () => void;
  onNavigateAddPet?: () => void;
  onToast?: (message: string) => void;
  initialStage?: BookingStage;
  initialDate?: string;
  initialPetId?: string;
  initialPets?: PetOption[];
  initialMasters?: MasterProfile[];
}

const UK_MONTH_NAMES = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

const UK_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function getWeekDays(startFullDate: string): WeekDayOption[] {
  const start = new Date(startFullDate + 'T00:00:00Z');
  const days: WeekDayOption[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const dayNumber = d.getUTCDate();
    const dayName = UK_DAY_NAMES[i];
    const fullDate = d.toISOString().split('T')[0];
    days.push({ dayName, dayNumber, fullDate });
  }
  return days;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  onBack,
  onComplete,
  onNavigateAddPet,
  onToast,
  initialStage = 'pet',
  initialDate,
  initialPetId,
  initialPets,
  initialMasters,
}) => {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<BookingStage>(initialStage);
  const [returnToConfirmation, setReturnToConfirmation] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [pets, setPets] = useState<PetOption[]>(initialPets || []);
  const [isLoadingPets, setIsLoadingPets] = useState(!initialPets);
  const [procedures, setProcedures] = useState<ProcedureOption[]>(PROCEDURES_CATALOG);
  const [masters, setMasters] = useState<MasterProfile[]>(initialMasters || []);
  const [currentMasterIndex, setCurrentMasterIndex] = useState(0);

  const initialDates = initialDate
    ? getInitialBookingDate(new Date(initialDate))
    : { date: '2026-08-11', dateFormatted: '11.08.2026', weekStartDate: '2026-08-09' };

  const [bookingState, setBookingState] = useState<BookingState>(() => {
    const defaultPet = (initialPets && initialPets[0]) || null;
    return {
      petId: defaultPet?.id || '',
      petName: defaultPet?.name || '',
      petSpecies: defaultPet?.species || '',
      petBreed: defaultPet?.breed,
      petAvatarUrl: defaultPet?.avatar_url || null,

      procedureId: PROCEDURES_CATALOG[0].id,
      procedureName: PROCEDURES_CATALOG[0].name,
      procedurePrice: PROCEDURES_CATALOG[0].price,
      procedureDurationMin: PROCEDURES_CATALOG[0].durationMin,

      masterId: (initialMasters && initialMasters[0]?.id) || 'any',
      masterName: (initialMasters && initialMasters[0]?.name) || 'Будь-який вільний майстер',
      masterRole: initialMasters && initialMasters[0]?.role,
      masterAvatarUrl: initialMasters && initialMasters[0]?.avatarUrl,

      date: initialDates.date,
      dateFormatted: initialDates.dateFormatted,
      timeSlot: '16:00',

      clientNote: '',
      transferEnabled: false,
      transferPrice: 100,
      transferAddress: '',
      behaviorNotes: '',

      paymentMethod: 'card',
    };
  });

  const [weekStartDate, setWeekStartDate] = useState<string>(
    initialDates.weekStartDate || '2026-08-09'
  );
  const [failedPetImages, setFailedPetImages] = useState<Record<string, boolean>>({});

  const showToast = (message: string) => {
    setFeedbackMessage(message);
    if (onToast) onToast(message);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!initialPets) {
        setIsLoadingPets(true);
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (userId && !initialPets) {
          const { data: userPets } = await supabase
            .from('pets')
            .select('id, name, species, breed')
            .eq('owner_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (isMounted) {
            if (userPets && userPets.length > 0) {
              const petIds = userPets.map((p) => p.id);
              const avatarMap = await fetchPetsAvatarMap(petIds);

              const mappedPets: PetOption[] = userPets.map((p) => ({
                id: p.id,
                name: p.name,
                species: p.species === 'dog' ? 'Собака' : p.species === 'cat' ? 'Кіт' : p.species,
                breed: p.breed || undefined,
                avatar_url: avatarMap[p.id] || null,
              }));
              setPets(mappedPets);
              const selectedPet =
                mappedPets.find((p) => p.id === initialPetId) || mappedPets[0];
              setBookingState((prev) => ({
                ...prev,
                petId: selectedPet.id,
                petName: selectedPet.name,
                petSpecies: selectedPet.species,
                petBreed: selectedPet.breed,
                petAvatarUrl: selectedPet.avatar_url || null,
              }));
            } else {
              setPets([]);
            }
          }
        }

        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name, description, price, duration_min')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (isMounted && servicesData && servicesData.length > 0) {
          const mappedServices: ProcedureOption[] = servicesData.map((s) => ({
            id: s.id,
            name: s.name,
            duration: `${s.duration_min} хв`,
            durationMin: s.duration_min,
            description: s.description || '',
            price: Number(s.price),
            priceFormatted: `від ${Math.round(Number(s.price))} ₴`,
          }));
          setProcedures(mappedServices);
        }

        if (!initialMasters) {
          const { data: mastersData } = await supabase
            .from('masters')
            .select('id, display_name, specialization, avatar_url, bio')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          if (isMounted && mastersData && mastersData.length > 0) {
            const mappedMasters: MasterProfile[] = mastersData.map((m) => ({
              id: m.id,
              name: m.display_name,
              role: m.specialization || 'Грумер',
              avatarUrl: m.avatar_url || '',
              specialties: m.bio ? [m.bio] : ['Грумінг'],
              reviewsCount: 0,
              reviews: [],
            }));
            setMasters(mappedMasters);
          }
        }
      } catch {
        // Fallbacks already in place
      } finally {
        if (isMounted && !initialPets) {
          setIsLoadingPets(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [initialPets, initialMasters, initialPetId]);

  const handleBack = () => {
    if (stage === 'pet') {
      if (onBack) onBack();
      return;
    }
    if (stage === 'procedure') {
      setStage('pet');
      return;
    }
    if (stage === 'master') {
      setStage('procedure');
      return;
    }
    if (stage === 'datetime') {
      setStage('master');
      return;
    }
    if (stage === 'remarks') {
      setStage('datetime');
      return;
    }
    if (stage === 'confirmation') {
      setStage('remarks');
      return;
    }
    if (stage === 'payment') {
      setStage('confirmation');
      return;
    }
  };

  const handleNextFromStep = (nextStage: BookingStage) => {
    if (returnToConfirmation) {
      setReturnToConfirmation(false);
      setStage('confirmation');
    } else {
      setStage(nextStage);
    }
  };

  const handleEditStage = (targetStage: BookingStage) => {
    setReturnToConfirmation(true);
    setStage(targetStage);
  };

  const handlePrevWeek = () => {
    const d = new Date(weekStartDate + 'T00:00:00Z');
    const prev = new Date(d.getTime() - 7 * 86400000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setWeekStartDate(`${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(prev.getUTCDate())}`);
  };

  const handleNextWeek = () => {
    const d = new Date(weekStartDate + 'T00:00:00Z');
    const next = new Date(d.getTime() + 7 * 86400000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setWeekStartDate(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`);
  };

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      let resolvedPetId = bookingState.petId;
      const isUUID = (val?: string) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      if (currentUserId && (!isUUID(resolvedPetId) || resolvedPetId.startsWith('p-'))) {
        try {
          const { data: userPets } = await supabase
            .from('pets')
            .select('id, name')
            .eq('owner_id', currentUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (userPets && userPets.length > 0) {
            const matching = userPets.find((p) => p.name === bookingState.petName);
            resolvedPetId = matching ? matching.id : userPets[0].id;
          }
        } catch {
          // Ignore
        }
      }

      const SERVICE_SLUG_MAP: Record<string, string> = {
        'express-grooming': '50000000-0000-0000-0000-000000000001',
        'spa-complex': '50000000-0000-0000-0000-000000000002',
        'ozone-therapy': '50000000-0000-0000-0000-000000000003',
        'hygiene-care': '50000000-0000-0000-0000-000000000004',
        'combing': '50000000-0000-0000-0000-000000000005',
        'breed-haircut': '50000000-0000-0000-0000-000000000006',
        'nail-trimming': '50000000-0000-0000-0000-000000000007',
      };

      const resolvedServiceId = isUUID(bookingState.procedureId)
        ? bookingState.procedureId
        : SERVICE_SLUG_MAP[bookingState.procedureId] || '50000000-0000-0000-0000-000000000001';

      const resolvedMasterId = isUUID(bookingState.masterId) ? bookingState.masterId : null;
      const startsAt = getKyivISOString(bookingState.date, bookingState.timeSlot);
      const endsAt = new Date(
        new Date(startsAt).getTime() + (bookingState.procedureDurationMin || 90) * 60000
      ).toISOString();

      const clientNoteParts = [
        bookingState.clientNote,
        bookingState.behaviorNotes ? `Поведінка: ${bookingState.behaviorNotes}` : '',
        bookingState.transferEnabled ? `Трансфер: ${bookingState.transferAddress}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      let appointmentCreated = false;

      if (typeof supabase.rpc === 'function') {
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('create_appointment', {
            p_pet_id: isUUID(resolvedPetId) ? resolvedPetId : null,
            p_master_id: resolvedMasterId,
            p_service_id: resolvedServiceId,
            p_starts_at: startsAt,
            p_client_note: clientNoteParts || null,
            p_source: 'mobile',
          });

          if (!rpcError && rpcData) {
            appointmentCreated = true;
          }
        } catch {
          // Fall through
        }
      }

      if (!appointmentCreated) {
        await supabase.from('appointments').insert({
          client_id: currentUserId || 'demo-user',
          pet_id: isUUID(resolvedPetId) ? resolvedPetId : undefined,
          master_id: resolvedMasterId || undefined,
          service_id: resolvedServiceId,
          price:
            bookingState.procedurePrice +
            (bookingState.transferEnabled ? bookingState.transferPrice : 0),
          starts_at: startsAt,
          ends_at: endsAt,
          status: 'confirmed',
          client_note: clientNoteParts || null,
        });
      }

      showToast('Візит успішно заброньовано!');
      if (onComplete) {
        onComplete();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Не вдалося створити візит';
      showToast(`Помилка бронювання: ${errMsg}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const totalAmount =
    bookingState.procedurePrice +
    (bookingState.transferEnabled ? bookingState.transferPrice : 0);

  const selectedProcedure =
    procedures.find((p) => p.id === bookingState.procedureId) || procedures[0];

  const currentMaster = masters[currentMasterIndex];

  const weekDays = getWeekDays(weekStartDate);
  const midDay = weekDays[3] || weekDays[0];
  const monthName =
    UK_MONTH_NAMES[new Date(midDay.fullDate + 'T00:00:00Z').getUTCMonth()];

  return (
    <View style={styles.container} testID="booking-screen">
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 16) + 4 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Назад"
          testID="booking-back-button"
        >
          <ArrowLeftIcon color={colors.contentPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Запис на грумінг</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {feedbackMessage && (
        <View style={styles.toastContainer} testID="booking-toast">
          <Text style={styles.toastText}>{feedbackMessage}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {stage === 'pet' && (
          <View testID="step-pet">
            <Text style={styles.stepHeading}>Оберіть улюбленця</Text>

            <View style={styles.petsGrid}>
              <TouchableOpacity
                style={styles.addPetCard}
                onPress={onNavigateAddPet}
                accessibilityRole="button"
                accessibilityLabel="Додати нового улюбленця"
                testID="booking-add-pet-button"
              >
                <View style={styles.addPetIconCircle}>
                  <PlusIcon color={colors.contentPrimary} size={24} />
                </View>
                <Text style={styles.addPetText}>Додати нового улюбленця</Text>
              </TouchableOpacity>

              {isLoadingPets ? (
                <View style={styles.loadingPetsCard} testID="loading-pets-indicator">
                  <ActivityIndicator size="small" color={colors.terracotta} />
                </View>
              ) : (
                pets.map((pet) => {
                  const isSelected = pet.id === bookingState.petId;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        styles.petCard,
                        isSelected && styles.petCardSelected,
                      ]}
                      onPress={() =>
                        setBookingState((prev) => ({
                          ...prev,
                          petId: pet.id,
                          petName: pet.name,
                          petSpecies: pet.species,
                          petBreed: pet.breed,
                          petAvatarUrl: pet.avatar_url,
                        }))
                      }
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      testID={`pet-card-${pet.id}`}
                    >
                      <View style={styles.petCardImageArea}>
                        {pet.avatar_url && !failedPetImages[pet.id] ? (
                          <Image
                            source={{ uri: pet.avatar_url }}
                            style={styles.petCardImage}
                            onError={() =>
                              setFailedPetImages((prev) => ({ ...prev, [pet.id]: true }))
                            }
                          />
                        ) : (
                          <View style={styles.petCardPlaceholder}>
                            <PawIcon color={colors.terracotta} size={28} />
                          </View>
                        )}
                      </View>
                      <View style={styles.petCardFooter}>
                        <Text style={styles.petCardName} numberOfLines={1}>
                          {pet.name}
                        </Text>
                        <Text style={styles.petCardBreed} numberOfLines={1}>
                          {pet.breed || pet.species}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!bookingState.petId || isLoadingPets) && styles.buttonDisabled,
              ]}
              disabled={!bookingState.petId || isLoadingPets}
              onPress={() => handleNextFromStep('procedure')}
              testID="next-step-button"
            >
              <Text style={styles.primaryButtonText}>Далі</Text>
            </TouchableOpacity>

            <BookingProgressBar currentStep={1} />
          </View>
        )}

        {stage === 'procedure' && (
          <View testID="step-procedure">
            <Text style={styles.stepHeading}>Обери процедуру</Text>

            <View style={styles.proceduresWrap}>
              {procedures.map((proc) => {
                const isSelected = proc.id === bookingState.procedureId;
                return (
                  <TouchableOpacity
                    key={proc.id}
                    style={[
                      styles.procedurePill,
                      isSelected && styles.procedurePillSelected,
                    ]}
                    onPress={() =>
                      setBookingState((prev) => ({
                        ...prev,
                        procedureId: proc.id,
                        procedureName: proc.name,
                        procedurePrice: proc.price,
                        procedureDurationMin: proc.durationMin,
                      }))
                    }
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    testID={`procedure-option-${proc.id}`}
                  >
                    <Text
                      style={[
                        styles.procedurePillText,
                        isSelected && styles.procedurePillTextSelected,
                      ]}
                    >
                      {proc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedProcedure && (
              <View style={styles.procedureDetailCard} testID="procedure-detail-card">
                <View style={styles.procedureDetailHeader}>
                  <Text style={styles.procedureDetailTitle}>
                    {selectedProcedure.name}
                  </Text>
                  <View style={styles.durationBadge}>
                    <ClockIcon color={colors.terracotta} size={14} />
                    <Text style={styles.durationBadgeText}>
                      {selectedProcedure.duration}
                    </Text>
                  </View>
                </View>

                <Text style={styles.procedureDetailDescription}>
                  {selectedProcedure.description}
                </Text>

                <View style={styles.procedureDetailFooter}>
                  <Text style={styles.procedureDetailFooterLabel}>
                    Вартість послуги
                  </Text>
                  <Text style={styles.procedureDetailPrice}>
                    {selectedProcedure.priceFormatted}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !bookingState.procedureId && styles.buttonDisabled,
              ]}
              disabled={!bookingState.procedureId}
              onPress={() => handleNextFromStep('master')}
              testID="next-step-button"
            >
              <Text style={styles.primaryButtonText}>Далі</Text>
            </TouchableOpacity>

            <BookingProgressBar currentStep={2} />
          </View>
        )}

        {stage === 'master' && (
          <View testID="step-master">
            <Text style={styles.stepHeading}>Вибір майстра</Text>

            <TouchableOpacity
              style={[
                styles.anyMasterCard,
                bookingState.masterId === 'any' && styles.anyMasterCardSelected,
              ]}
              onPress={() =>
                setBookingState((prev) => ({
                  ...prev,
                  masterId: 'any',
                  masterName: 'Будь-який вільний майстер',
                  masterRole: undefined,
                  masterAvatarUrl: undefined,
                }))
              }
              accessibilityRole="radio"
              accessibilityState={{ selected: bookingState.masterId === 'any' }}
              testID="choose-any-master"
            >
              <View style={styles.anyMasterIconArea}>
                <UserIcon color={colors.terracotta} size={24} />
              </View>
              <View style={styles.anyMasterTextArea}>
                <Text style={styles.anyMasterTitle}>Будь-який вільний майстер</Text>
                <Text style={styles.anyMasterSubtitle}>
                  Ми підберемо найкращого спеціаліста на обраний час
                </Text>
              </View>
            </TouchableOpacity>

            {masters.length > 0 && currentMaster && (
              <View style={styles.masterCarouselCard} testID="master-carousel-card">
                <View style={styles.masterHeaderRow}>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentMasterIndex((prev) =>
                        prev > 0 ? prev - 1 : masters.length - 1
                      )
                    }
                    style={styles.carouselArrowButton}
                    testID="prev-master-button"
                  >
                    <AngleSmallLeftIcon color={colors.contentPrimary} size={22} />
                  </TouchableOpacity>

                  <View style={styles.masterAvatarWrapper}>
                    {currentMaster.avatarUrl ? (
                      <Image
                        source={{ uri: currentMaster.avatarUrl }}
                        style={styles.masterAvatarImage}
                      />
                    ) : (
                      <View style={styles.masterAvatarPlaceholder}>
                        <UserIcon color={colors.textMuted} size={40} />
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentMasterIndex((prev) =>
                        prev < masters.length - 1 ? prev + 1 : 0
                      )
                    }
                    style={styles.carouselArrowButton}
                    testID="next-master-button"
                  >
                    <AngleSmallLeftIcon
                      color={colors.contentPrimary}
                      size={22}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.masterName}>{currentMaster.name}</Text>
                <Text style={styles.masterRole}>{currentMaster.role}</Text>

                <View style={styles.specialtiesWrap}>
                  {currentMaster.specialties.map((spec, idx) => (
                    <View key={idx} style={styles.specialtyBadge}>
                      <Text style={styles.specialtyBadgeText}>{spec}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectMasterButton,
                    bookingState.masterId === currentMaster.id &&
                      styles.selectMasterButtonActive,
                  ]}
                  onPress={() =>
                    setBookingState((prev) => ({
                      ...prev,
                      masterId: currentMaster.id,
                      masterName: currentMaster.name,
                      masterRole: currentMaster.role,
                      masterAvatarUrl: currentMaster.avatarUrl,
                    }))
                  }
                  testID="select-current-master-button"
                >
                  <Text
                    style={[
                      styles.selectMasterButtonText,
                      bookingState.masterId === currentMaster.id &&
                        styles.selectMasterButtonTextActive,
                    ]}
                  >
                    {bookingState.masterId === currentMaster.id
                      ? 'Обрано'
                      : 'Обрати майстра'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleNextFromStep('datetime')}
              testID="next-step-button"
            >
              <Text style={styles.primaryButtonText}>Далі</Text>
            </TouchableOpacity>

            <BookingProgressBar currentStep={3} />
          </View>
        )}

        {stage === 'datetime' && (
          <View testID="step-datetime">
            <Text style={styles.stepHeading}>Дата та час</Text>

            <View style={styles.weekNavigator}>
              <TouchableOpacity
                onPress={handlePrevWeek}
                style={styles.navArrowButton}
                testID="prev-week-button"
              >
                <AngleSmallLeftIcon color={colors.contentPrimary} size={22} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthName}</Text>
              <TouchableOpacity
                onPress={handleNextWeek}
                style={styles.navArrowButton}
                testID="next-week-button"
              >
                <AngleSmallLeftIcon color={colors.contentPrimary} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContent}
              style={styles.daysScrollView}
            >
              {weekDays.map((day) => {
                const isSelected = day.fullDate === bookingState.date;
                return (
                  <TouchableOpacity
                    key={day.fullDate}
                    style={[
                      styles.dayPill,
                      isSelected && styles.dayPillSelected,
                    ]}
                    onPress={() => {
                      const parts = day.fullDate.split('-');
                      const formatted = `${parts[2]}.${parts[1]}.${parts[0]}`;
                      setBookingState((prev) => ({
                        ...prev,
                        date: day.fullDate,
                        dateFormatted: formatted,
                      }));
                    }}
                    testID={`day-pill-${day.fullDate}`}
                  >
                    <Text
                      style={[
                        styles.dayPillName,
                        isSelected && styles.dayPillNameSelected,
                      ]}
                    >
                      {day.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillNumber,
                        isSelected && styles.dayPillNumberSelected,
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionSubtitle}>Оберіть час</Text>
            <View style={styles.timeSlotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot === bookingState.timeSlot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlotChip,
                      isSelected && styles.timeSlotChipSelected,
                    ]}
                    onPress={() =>
                      setBookingState((prev) => ({
                        ...prev,
                        timeSlot: slot,
                      }))
                    }
                    testID={`time-slot-${slot}`}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleNextFromStep('remarks')}
              testID="next-step-button"
            >
              <Text style={styles.primaryButtonText}>Далі</Text>
            </TouchableOpacity>

            <BookingProgressBar currentStep={4} />
          </View>
        )}

        {stage === 'remarks' && (
          <View testID="step-remarks">
            <Text style={styles.stepHeading}>Додаткові побажання</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Коментар для майстра</Text>
              <TextInput
                style={styles.textInput}
                value={bookingState.clientNote}
                onChangeText={(text) =>
                  setBookingState((prev) => ({ ...prev, clientNote: text }))
                }
                placeholder="Ваші побажання або деталі"
                placeholderTextColor={colors.textMuted}
                testID="remarks-comment-input"
              />
            </View>

            <TouchableOpacity
              style={styles.transferToggleRow}
              onPress={() =>
                setBookingState((prev) => ({
                  ...prev,
                  transferEnabled: !prev.transferEnabled,
                }))
              }
              activeOpacity={0.8}
              testID="transfer-switch"
              accessibilityRole="switch"
              accessibilityState={{ checked: bookingState.transferEnabled }}
            >
              <View style={styles.transferToggleTextContainer}>
                <Text style={styles.transferToggleTitle}>Трансфер улюбленця</Text>
                <Text style={styles.transferToggleSubtitle}>+100 ₴ до вартості</Text>
              </View>
              <Switch
                value={bookingState.transferEnabled}
                onValueChange={(val) =>
                  setBookingState((prev) => ({ ...prev, transferEnabled: val }))
                }
                trackColor={{ false: colors.visitGray, true: colors.terracotta }}
                thumbColor={colors.surfaceWhite}
              />
            </TouchableOpacity>

            {bookingState.transferEnabled && (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Адреса</Text>
                <TextInput
                  style={styles.textInput}
                  value={bookingState.transferAddress}
                  onChangeText={(text) =>
                    setBookingState((prev) => ({ ...prev, transferAddress: text }))
                  }
                  placeholder="Введіть адресу подачі"
                  placeholderTextColor={colors.textMuted}
                  testID="remarks-address-input"
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Особливості поведінки</Text>
              <TextInput
                style={styles.textInput}
                value={bookingState.behaviorNotes}
                onChangeText={(text) =>
                  setBookingState((prev) => ({ ...prev, behaviorNotes: text }))
                }
                placeholder="Боязкість, агресія, реакція на фен тощо"
                placeholderTextColor={colors.textMuted}
                testID="remarks-behavior-input"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleNextFromStep('confirmation')}
              testID="next-step-button"
            >
              <Text style={styles.primaryButtonText}>Далі</Text>
            </TouchableOpacity>

            <BookingProgressBar currentStep={5} />
          </View>
        )}

        {stage === 'confirmation' && (
          <View testID="step-confirmation">
            <Text style={styles.stepHeading}>Деталі запису</Text>

            <View style={styles.summaryList}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.summaryIconBadge}>
                    <PawIcon color={colors.terracotta} size={18} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Улюбленець</Text>
                    <Text style={styles.summaryValue}>
                      {bookingState.petName || 'Не обрано'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('pet')}
                  style={styles.editButton}
                  accessibilityLabel="Редагувати: Улюбленець"
                  testID="edit-pet-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.summaryIconBadge}>
                    <ClockIcon color={colors.terracotta} size={18} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Процедура</Text>
                    <Text style={styles.summaryValue}>
                      {bookingState.procedureName || 'Не обрано'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('procedure')}
                  style={styles.editButton}
                  accessibilityLabel="Редагувати: Процедура"
                  testID="edit-procedure-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.summaryIconBadge}>
                    <UserIcon color={colors.terracotta} size={18} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Майстер</Text>
                    <Text style={styles.summaryValue}>
                      {bookingState.masterName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('master')}
                  style={styles.editButton}
                  accessibilityLabel="Редагувати: Майстер"
                  testID="edit-master-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.summaryIconBadge}>
                    <ClockIcon color={colors.terracotta} size={18} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Дата та час</Text>
                    <Text style={styles.summaryValue}>
                      {bookingState.dateFormatted}, {bookingState.timeSlot}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('datetime')}
                  style={styles.editButton}
                  accessibilityLabel="Редагувати: Дата та час"
                  testID="edit-datetime-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.summaryIconBadge}>
                    <CreditCardIcon color={colors.terracotta} size={18} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Вартість процедур</Text>
                    <Text style={styles.summaryValue}>
                      {bookingState.procedurePrice} ₴
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('procedure')}
                  style={styles.editButton}
                  accessibilityLabel="Редагувати: Вартість"
                  testID="edit-price-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.summaryIconBadge}>
                    <PawIcon color={colors.terracotta} size={18} />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Трансфер улюбленця</Text>
                    <Text style={styles.summaryValue}>
                      {bookingState.transferEnabled
                        ? `${bookingState.transferPrice} ₴`
                        : 'Не замовлено'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('remarks')}
                  style={styles.editButton}
                  accessibilityLabel="Редагувати: Трансфер"
                  testID="edit-transfer-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Разом до сплати:</Text>
              <Text style={styles.totalAmount}>{totalAmount} ₴</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setStage('payment')}
              testID="confirm-booking-button"
            >
              <Text style={styles.primaryButtonText}>Підтвердити запис</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'payment' && (
          <View testID="step-payment">
            <Text style={styles.stepHeading}>Способи оплати</Text>

            <View style={styles.paymentMethodsList}>
              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  bookingState.paymentMethod === 'card' &&
                    styles.paymentMethodCardSelected,
                ]}
                onPress={() =>
                  setBookingState((prev) => ({ ...prev, paymentMethod: 'card' }))
                }
                testID="payment-method-card"
              >
                <View style={styles.paymentMethodCardLeft}>
                  <CreditCardIcon color={colors.contentPrimary} size={20} />
                  <Text style={styles.paymentMethodTitle}>Банківська картка</Text>
                </View>
                {bookingState.paymentMethod === 'card' && (
                  <CheckIcon color={colors.terracotta} size={16} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethodCard,
                  bookingState.paymentMethod === 'cash' &&
                    styles.paymentMethodCardSelected,
                ]}
                onPress={() =>
                  setBookingState((prev) => ({ ...prev, paymentMethod: 'cash' }))
                }
                testID="payment-method-cash"
              >
                <View style={styles.paymentMethodCardLeft}>
                  <CashIcon color={colors.contentPrimary} size={20} />
                  <Text style={styles.paymentMethodTitle}>Оплата в салоні</Text>
                </View>
                {bookingState.paymentMethod === 'cash' && (
                  <CheckIcon color={colors.terracotta} size={16} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.paymentBreakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Вартість послуги</Text>
                <Text style={styles.breakdownValue}>
                  {bookingState.procedurePrice} ₴
                </Text>
              </View>
              {bookingState.transferEnabled && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Трансфер</Text>
                  <Text style={styles.breakdownValue}>
                    {bookingState.transferPrice} ₴
                  </Text>
                </View>
              )}
              <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                <Text style={styles.breakdownTotalLabel}>Всього</Text>
                <Text style={styles.breakdownTotalValue}>{totalAmount} ₴</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isProcessingPayment && styles.buttonDisabled,
              ]}
              disabled={isProcessingPayment}
              onPress={handleProcessPayment}
              testID="submit-payment-button"
            >
              {isProcessingPayment ? (
                <ActivityIndicator color={colors.surfaceWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Оплатити {totalAmount} ₴
                </Text>
              )}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.visitGray,
    backgroundColor: colors.surfaceCream,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentDark,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 20,
  },
  petsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  addPetCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  addPetIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addPetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.contentDark,
    textAlign: 'center',
  },
  loadingPetsCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceWhite,
  },
  petCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.visitGray,
    backgroundColor: colors.surfaceWhite,
    overflow: 'hidden',
  },
  petCardSelected: {
    borderColor: colors.terracotta,
  },
  petCardImageArea: {
    flex: 1,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  petCardPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCardFooter: {
    padding: 8,
    backgroundColor: colors.surfaceWhite,
  },
  petCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.contentDark,
  },
  petCardBreed: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  proceduresWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  procedurePill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.contentDark,
    backgroundColor: colors.surfaceWhite,
  },
  procedurePillSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  procedurePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentDark,
  },
  procedurePillTextSelected: {
    color: colors.surfaceWhite,
  },
  procedureDetailCard: {
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: 'rgba(36, 47, 53, 0.15)',
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  procedureDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  procedureDetailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.contentDark,
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.visitGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  durationBadgeText: {
    fontSize: 12,
    color: colors.contentDark,
    fontWeight: '500',
  },
  procedureDetailDescription: {
    fontSize: 13,
    color: colors.contentDark,
    lineHeight: 18,
    opacity: 0.8,
  },
  procedureDetailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 47, 53, 0.1)',
  },
  procedureDetailFooterLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  procedureDetailPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.terracotta,
  },
  anyMasterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.visitGray,
    backgroundColor: colors.surfaceWhite,
    marginBottom: 16,
  },
  anyMasterCardSelected: {
    borderColor: colors.terracotta,
  },
  anyMasterIconArea: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anyMasterTextArea: {
    flex: 1,
  },
  anyMasterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentDark,
  },
  anyMasterSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  masterCarouselCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.visitGray,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  masterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  carouselArrowButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: colors.visitGray,
  },
  masterAvatarImage: {
    width: '100%',
    height: '100%',
  },
  masterAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 2,
  },
  masterRole: {
    fontSize: 13,
    color: colors.terracotta,
    fontWeight: '600',
    marginBottom: 10,
  },
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  specialtyBadge: {
    backgroundColor: colors.visitGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  specialtyBadgeText: {
    fontSize: 12,
    color: colors.contentDark,
  },
  selectMasterButton: {
    width: '100%',
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectMasterButtonActive: {
    backgroundColor: colors.terracotta,
  },
  selectMasterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.terracotta,
  },
  selectMasterButtonTextActive: {
    color: colors.surfaceWhite,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrowButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentDark,
  },
  daysScrollView: {
    marginBottom: 20,
  },
  daysScrollContent: {
    gap: 8,
  },
  dayPill: {
    width: 48,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.visitGray,
    alignItems: 'center',
  },
  dayPillSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  dayPillName: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  dayPillNameSelected: {
    color: colors.surfaceWhite,
  },
  dayPillNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentDark,
  },
  dayPillNumberSelected: {
    color: colors.surfaceWhite,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 12,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  timeSlotChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.visitGray,
  },
  timeSlotChipSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentDark,
  },
  timeSlotTextSelected: {
    color: colors.surfaceWhite,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentDark,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.visitGray,
    fontSize: 15,
    color: colors.contentDark,
    paddingVertical: 6,
  },
  transferToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.visitGray,
    marginBottom: 16,
  },
  transferToggleTextContainer: {
    flex: 1,
  },
  transferToggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.contentDark,
  },
  transferToggleSubtitle: {
    fontSize: 12,
    color: colors.terracotta,
    marginTop: 2,
  },
  summaryList: {
    gap: 10,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.visitGray,
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  summaryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.terracotta,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.contentDark,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.visitGray,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.contentDark,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.terracotta,
  },
  paymentMethodsList: {
    gap: 10,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.visitGray,
    backgroundColor: colors.surfaceWhite,
  },
  paymentMethodCardSelected: {
    borderColor: colors.terracotta,
  },
  paymentMethodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.contentDark,
  },
  paymentBreakdownCard: {
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: '#FCFAF7',
    borderWidth: 1,
    borderColor: 'rgba(36, 47, 53, 0.1)',
    marginBottom: 24,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.contentDark,
    opacity: 0.8,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentDark,
  },
  breakdownTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 47, 53, 0.1)',
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.contentDark,
  },
  breakdownTotalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.terracotta,
  },
  primaryButton: {
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surfaceWhite,
  },
  buttonDisabled: {
    backgroundColor: colors.borderLight,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: colors.navyDark,
    padding: 12,
    borderRadius: radii.sm,
    zIndex: 999,
    alignItems: 'center',
  },
  toastText: {
    color: colors.surfaceWhite,
    fontSize: 13,
    fontWeight: '500',
  },
});
