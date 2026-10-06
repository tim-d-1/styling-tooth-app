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
  Modal,
  Platform,
  KeyboardAvoidingView,
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
  MarkerIcon,
  ScissorsIcon,
} from '../../components/icons/AuthIcons';
import {
  ClockIcon,
  AngleSmallLeftIcon,
  AngleSmallRightIcon,
  ApplePayIcon,
  CashIcon,
  CheckCircleIcon,
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
  bottomInset?: number;
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
  bottomInset,
}) => {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<BookingStage>(initialStage);

  useEffect(() => {
    if (initialStage) {
      setStage(initialStage);
    }
  }, [initialStage]);
  const [returnToConfirmation, setReturnToConfirmation] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [pets, setPets] = useState<PetOption[]>(initialPets || []);
  const [isLoadingPets, setIsLoadingPets] = useState(!initialPets);
  const [procedures, setProcedures] = useState<ProcedureOption[]>(PROCEDURES_CATALOG);
  const [masters, setMasters] = useState<MasterProfile[]>(initialMasters || []);
  const [currentMasterIndex, setCurrentMasterIndex] = useState(0);
  const [modalProcedure, setModalProcedure] = useState<ProcedureOption | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

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
    if (stage === 'completed') {
      if (onComplete) {
        onComplete();
      } else if (onBack) {
        onBack();
      }
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

      if (saveCard && cardNumber.replace(/\s+/g, '').length >= 4) {
        try {
          const last4 = cardNumber.replace(/\s+/g, '').slice(-4);
          const currentMeta = sessionData?.session?.user?.user_metadata || {};
          const existingMethods = Array.isArray(currentMeta.payment_methods)
            ? currentMeta.payment_methods
            : [];
          const updatedMethods = [
            ...existingMethods,
            {
              id: `card-${Date.now()}`,
              type: 'card',
              last4,
              expiry: expiry || '12/28',
            },
          ];
          await supabase.auth.updateUser({
            data: { payment_methods: updatedMethods },
          });
        } catch {
          // Ignore
        }
      }

      showToast('Візит успішно заброньовано!');
      if (onComplete) {
        onComplete();
      }
      setStage('completed');
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

  const isStepWithBottomBar =
    stage === 'pet' ||
    stage === 'procedure' ||
    stage === 'master' ||
    stage === 'datetime' ||
    stage === 'remarks';

  const getStepNumber = (): number => {
    switch (stage) {
      case 'pet':
        return 1;
      case 'procedure':
        return 2;
      case 'master':
        return 3;
      case 'datetime':
        return 4;
      case 'remarks':
        return 5;
      default:
        return 1;
    }
  };

  const isNextDisabled =
    (stage === 'pet' && (!bookingState.petId || isLoadingPets)) ||
    (stage === 'procedure' && !bookingState.procedureId);

  const handleNextPress = () => {
    switch (stage) {
      case 'pet':
        handleNextFromStep('procedure');
        break;
      case 'procedure':
        handleNextFromStep('master');
        break;
      case 'master':
        handleNextFromStep('datetime');
        break;
      case 'datetime':
        handleNextFromStep('remarks');
        break;
      case 'remarks':
        handleNextFromStep('confirmation');
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="booking-screen"
    >
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
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isStepWithBottomBar
            ? { paddingBottom: 24 }
            : { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {stage === 'pet' && (
          <View testID="step-pet">
            <Text style={styles.stepHeading}>Оберіть улюбленця</Text>

            <View style={styles.petsGrid}>
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
              style={styles.outlineAddPetButton}
              onPress={onNavigateAddPet}
              accessibilityRole="button"
              accessibilityLabel="Додати нового улюбленця"
              testID="booking-add-pet-button"
            >
              <Text style={styles.outlineAddPetText}>Додати нового улюбленця</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'procedure' && (
          <View testID="step-procedure">
            <Text style={styles.stepHeading}>Обери процедуру</Text>

            <View style={styles.proceduresColumn}>
              {procedures.map((proc) => {
                const isSelected = proc.id === bookingState.procedureId;
                return (
                  <TouchableOpacity
                    key={proc.id}
                    style={[
                      styles.procedureCard,
                      isSelected && styles.procedureCardSelected,
                    ]}
                    onPress={() => {
                      setBookingState((prev) => ({
                        ...prev,
                        procedureId: proc.id,
                        procedureName: proc.name,
                        procedurePrice: proc.price,
                        procedureDurationMin: proc.durationMin,
                      }));
                      setModalProcedure(proc);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    testID={`procedure-option-${proc.id}`}
                  >
                    <Text
                      style={[
                        styles.procedureCardText,
                        isSelected && styles.procedureCardTextSelected,
                      ]}
                    >
                      {proc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Modal
              visible={modalProcedure !== null}
              transparent
              animationType="slide"
              onRequestClose={() => setModalProcedure(null)}
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity
                  style={styles.modalBackdropTouch}
                  activeOpacity={1}
                  onPress={() => setModalProcedure(null)}
                />
                <View style={styles.modalSheet} testID="procedure-modal-sheet">
                  <View style={styles.modalDragHandleContainer}>
                    <View style={styles.modalDragHandle} />
                  </View>

                  {modalProcedure && (
                    <View style={styles.modalContent}>
                      <View style={styles.modalTitleRow}>
                        <Text style={styles.modalTitle}>{modalProcedure.name}</Text>
                        <Text style={styles.modalDuration}>{modalProcedure.duration}</Text>
                      </View>

                      <View style={styles.modalDescriptionBox}>
                        <Text style={styles.modalDescriptionText}>
                          {modalProcedure.description}
                        </Text>
                      </View>

                      <Text style={styles.modalPrice}>{modalProcedure.priceFormatted}</Text>

                      <TouchableOpacity
                        style={styles.modalPrimaryButton}
                        onPress={() => {
                          setBookingState((prev) => ({
                            ...prev,
                            procedureId: modalProcedure.id,
                            procedureName: modalProcedure.name,
                            procedurePrice: modalProcedure.price,
                            procedureDurationMin: modalProcedure.durationMin,
                          }));
                          setModalProcedure(null);
                          handleNextFromStep('master');
                        }}
                        testID="modal-select-procedure-button"
                      >
                        <Text style={styles.modalPrimaryButtonText}>Записатись</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalSecondaryLink}
                        onPress={() => setModalProcedure(null)}
                      >
                        <Text style={styles.modalSecondaryLinkText}>
                          Додати ще процедуру
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
          </View>
        )}

        {stage === 'master' && (
          <View testID="step-master">
            <Text style={styles.stepHeading}>Вибір майстра</Text>

            {masters.length > 0 && currentMaster && (
              <View style={styles.masterFigmaCard} testID="master-carousel-card">
                <View style={styles.masterAvatar105Wrapper}>
                  {currentMaster.avatarUrl ? (
                    <Image
                      source={{ uri: currentMaster.avatarUrl }}
                      style={styles.masterAvatar105}
                    />
                  ) : (
                    <View style={styles.masterAvatar105Placeholder}>
                      <UserIcon color={colors.textMuted} size={48} />
                    </View>
                  )}
                </View>

                <Text style={styles.masterFigmaName}>{currentMaster.name}</Text>
                <Text style={styles.masterFigmaRole}>{currentMaster.role}</Text>

                <View style={styles.masterBadgesStack}>
                  <View style={styles.masterReviewsBadge}>
                    <Text style={styles.masterReviewsBadgeText}>
                      {currentMaster.reviewsCount > 0
                        ? `${currentMaster.reviewsCount} відгуків`
                        : '176 відгуків'}
                    </Text>
                  </View>

                  {(currentMaster.specialties && currentMaster.specialties.length > 0
                    ? currentMaster.specialties
                    : ['Відновлення шерсті', 'Озонотерапія', 'Креативний грумінг']
                  ).map((spec, idx) => (
                    <View key={idx} style={styles.masterSpecialtyPill}>
                      <Text style={styles.masterSpecialtyPillText}>{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.masterCarouselRow}>
              <TouchableOpacity
                onPress={() =>
                  setCurrentMasterIndex((prev) =>
                    prev > 0 ? prev - 1 : masters.length - 1
                  )
                }
                style={styles.masterCircleArrowButton}
                testID="prev-master-button"
                accessibilityLabel="Попередній майстер"
              >
                <AngleSmallLeftIcon color={colors.contentPrimary} size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.masterSelectCta,
                  currentMaster && bookingState.masterId === currentMaster.id &&
                    styles.masterSelectCtaActive,
                ]}
                onPress={() => {
                  if (currentMaster) {
                    setBookingState((prev) => ({
                      ...prev,
                      masterId: currentMaster.id,
                      masterName: currentMaster.name,
                      masterRole: currentMaster.role,
                      masterAvatarUrl: currentMaster.avatarUrl,
                    }));
                  }
                }}
                testID="select-current-master-button"
              >
                <Text style={styles.masterSelectCtaText}>
                  {currentMaster && bookingState.masterId === currentMaster.id
                    ? 'Обрано'
                    : 'Обрати майстра'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setCurrentMasterIndex((prev) =>
                    prev < masters.length - 1 ? prev + 1 : 0
                  )
                }
                style={styles.masterCircleArrowButton}
                testID="next-master-button"
                accessibilityLabel="Наступний майстер"
              >
                <AngleSmallRightIcon color={colors.contentPrimary} size={18} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.anyMasterOutlineButton,
                bookingState.masterId === 'any' && styles.anyMasterOutlineButtonActive,
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
              <Text
                style={[
                  styles.anyMasterOutlineText,
                  bookingState.masterId === 'any' && styles.anyMasterOutlineTextActive,
                ]}
              >
                Будь-який вільний майстер
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'datetime' && (
          <View testID="step-datetime">
            <Text style={styles.stepHeading}>Коли вам зручно?</Text>
            <Text style={styles.stepSubheading}>Дата та час</Text>

            <View style={styles.calendarCard}>
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  onPress={handlePrevWeek}
                  style={styles.circleNavButton}
                  testID="prev-week-button"
                  accessibilityLabel="Попередній тиждень"
                >
                  <AngleSmallLeftIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>

                <Text style={styles.monthTitleBold}>{monthName}</Text>

                <TouchableOpacity
                  onPress={handleNextWeek}
                  style={styles.circleNavButton}
                  testID="next-week-button"
                  accessibilityLabel="Наступний тиждень"
                >
                  <AngleSmallRightIcon color={colors.contentPrimary} size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.sevenDaysStrip}>
                {weekDays.map((day) => {
                  const isSelected = day.fullDate === bookingState.date;
                  return (
                    <TouchableOpacity
                      key={day.fullDate}
                      style={[
                        styles.dayStripItem,
                        isSelected && styles.dayStripItemSelected,
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
                          styles.dayStripName,
                          isSelected && styles.dayStripTextSelected,
                        ]}
                      >
                        {day.dayName.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          styles.dayStripNumber,
                          isSelected && styles.dayStripTextSelected,
                        ]}
                      >
                        {day.dayNumber}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.sectionSubtitle}>Оберіть час</Text>
            <View style={styles.timeSlotsTwoColGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot === bookingState.timeSlot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlotTwoColChip,
                      isSelected && styles.timeSlotTwoColChipSelected,
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
                        styles.timeSlotTwoColText,
                        isSelected && styles.timeSlotTwoColTextSelected,
                      ]}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
          </View>
        )}

        {stage === 'confirmation' && (
          <View testID="step-confirmation">
            <View style={styles.summaryFormCard}>
              <Text style={styles.summaryFormTitle}>Деталі запису</Text>

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <PawIcon color={colors.terracotta} size={19} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Улюбленець</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.petName || 'Барон'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('pet')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Улюбленець"
                  testID="edit-pet-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <ScissorsIcon color={colors.terracotta} size={17} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Процедура</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.procedureName || 'Комплексний грумінг'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('procedure')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Процедура"
                  testID="edit-procedure-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <UserIcon color={colors.terracotta} size={20} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Майстер</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.masterName}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('master')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Майстер"
                  testID="edit-master-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryFigmaDivider} />

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <ClockIcon color={colors.terracotta} size={20} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Дата візиту</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.dateFormatted}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('datetime')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Дата візиту"
                  testID="edit-datetime-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <ClockIcon color={colors.terracotta} size={17} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Час</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.timeSlot}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('datetime')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Час"
                  testID="edit-time-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryFigmaDivider} />

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <CreditCardIcon color={colors.terracotta} size={17} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Вартість обраних процедур</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.procedurePrice} ₴
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('procedure')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Вартість"
                  testID="edit-price-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryFigmaRow}>
                <View style={styles.summaryFigmaRowLeft}>
                  <View style={styles.summaryCircleIconBadge}>
                    <MarkerIcon color={colors.terracotta} size={17} />
                  </View>
                  <View style={styles.summaryFigmaTextStack}>
                    <Text style={styles.summaryFigmaLabel}>Трансфер улюбленця</Text>
                    <Text style={styles.summaryFigmaValue}>
                      {bookingState.transferEnabled
                        ? `${bookingState.transferPrice} ₴`
                        : 'Не замовлено'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEditStage('remarks')}
                  style={styles.summaryFigmaEditButton}
                  accessibilityLabel="Редагувати: Трансфер"
                  testID="edit-transfer-button"
                >
                  <PencilIcon color={colors.contentPrimary} size={18} />
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
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[
                    styles.paymentMethodCard,
                    bookingState.paymentMethod === 'card' &&
                      styles.paymentMethodCardSelected,
                  ]}
                  onPress={() =>
                    setBookingState((prev) => ({ ...prev, paymentMethod: 'card' }))
                  }
                  testID="payment-method-apple-pay"
                >
                  <View style={styles.paymentMethodCardLeft}>
                    <ApplePayIcon color={colors.contentDark} size={24} />
                    <View>
                      <Text style={styles.paymentMethodTitle}>Apple Pay</Text>
                      <Text style={styles.paymentMethodSubtitleGreen}>
                        Основний спосіб
                      </Text>
                    </View>
                  </View>
                  <CheckIcon color={colors.terracotta} size={16} />
                </TouchableOpacity>
              )}

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

            {bookingState.paymentMethod === 'card' && (
              <View style={styles.cardFormCard} testID="card-form-card">
                <Text style={styles.cardFormTitle}>Додати банківську картку</Text>

                <View style={styles.cardFormField}>
                  <Text style={styles.cardFormLabel}>Номер картки</Text>
                  <View style={styles.cardInputRow}>
                    <TextInput
                      style={styles.cardTextInput}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      placeholder="0000 0000 0000 0000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      maxLength={19}
                      testID="card-number-input"
                    />
                    <CreditCardIcon color={colors.contentPrimary} size={20} />
                  </View>
                </View>

                <View style={styles.cardTwoColRow}>
                  <View style={[styles.cardFormField, { flex: 1 }]}>
                    <Text style={styles.cardFormLabel}>Термін (MM/YY)</Text>
                    <TextInput
                      style={styles.cardInputSolo}
                      value={expiry}
                      onChangeText={setExpiry}
                      placeholder="12/27"
                      placeholderTextColor={colors.textMuted}
                      maxLength={5}
                      testID="card-expiry-input"
                    />
                  </View>
                  <View style={[styles.cardFormField, { flex: 1 }]}>
                    <Text style={styles.cardFormLabel}>CVV / CVC</Text>
                    <TextInput
                      style={styles.cardInputSolo}
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="•••"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      maxLength={4}
                      keyboardType="numeric"
                      testID="card-cvv-input"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveCardCheckboxRow}
                  onPress={() => setSaveCard(!saveCard)}
                  activeOpacity={0.8}
                >
                  <Switch
                    value={saveCard}
                    onValueChange={setSaveCard}
                    trackColor={{ false: colors.visitGray, true: colors.terracotta }}
                    thumbColor={colors.surfaceWhite}
                    testID="save-card-switch"
                  />
                  <Text style={styles.saveCardLabel}>
                    Зберегти картку для швидкої оплати
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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

        {stage === 'completed' && (
          <View style={styles.completedContainer} testID="step-completed">
            <View style={styles.completedCenterCard}>
              <View style={styles.completedIconWrapper}>
                <CheckCircleIcon size={56} color="#34C759" />
              </View>
              <Text style={styles.completedTitle}>Запис підтверджено!</Text>
              <Text style={styles.completedSubtitle}>
                За 24 години до візиту ми{'\n'}надішлемо вам нагадування
              </Text>

              <View style={styles.completedActionsStack}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    if (onComplete) {
                      onComplete();
                    } else if (onBack) {
                      onBack();
                    }
                  }}
                  testID="view-booking-button"
                >
                  <Text style={styles.primaryButtonText}>Переглянути запис</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outlineSecondaryButton}
                  onPress={() => {
                    if (onComplete) {
                      onComplete();
                    } else if (onBack) {
                      onBack();
                    }
                  }}
                  testID="go-home-button"
                >
                  <Text style={styles.outlineSecondaryButtonText}>На головну</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {isStepWithBottomBar && (
        <View
          style={[
            styles.bottomBarContainer,
            {
              paddingBottom:
                bottomInset !== undefined ? bottomInset : Math.max(insets.bottom, 12),
            },
          ]}
          testID="booking-bottom-bar"
        >
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isNextDisabled && styles.buttonDisabled,
            ]}
            disabled={isNextDisabled}
            onPress={handleNextPress}
            accessibilityRole="button"
            accessibilityLabel="Далі"
            testID="next-step-button"
          >
            <Text style={styles.primaryButtonText}>Далі</Text>
          </TouchableOpacity>

          <BookingProgressBar
            currentStep={getStepNumber()}
            style={styles.bottomBarProgressBar}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
  },
  scrollView: {
    flex: 1,
  },
  bottomBarContainer: {
    backgroundColor: colors.surfaceCream,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.visitGray,
  },
  bottomBarProgressBar: {
    marginTop: 12,
    marginBottom: 4,
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
  outlineAddPetButton: {
    width: '100%',
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.contentDark,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  outlineAddPetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.contentDark,
  },
  proceduresColumn: {
    gap: 12,
    marginBottom: 20,
  },
  procedureCard: {
    height: 56,
    width: '100%',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.contentDark,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  procedureCardSelected: {
    backgroundColor: colors.terracotta,
    borderWidth: 0,
    borderRadius: radii.md,
  },
  procedureCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.contentDark,
    textAlign: 'center',
  },
  procedureCardTextSelected: {
    color: colors.surfaceCream,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 47, 53, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.surfaceCream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  modalDragHandleContainer: {
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: 'center',
  },
  modalDragHandle: {
    width: 40,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.visitGray,
  },
  modalContent: {
    gap: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentDark,
    flex: 1,
  },
  modalDuration: {
    fontSize: 15,
    color: colors.contentDark,
  },
  modalDescriptionBox: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: radii.sm,
    padding: 12,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: colors.contentDark,
    lineHeight: 20,
  },
  modalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentDark,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  modalPrimaryButton: {
    height: 48,
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surfaceCream,
  },
  modalSecondaryLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  modalSecondaryLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.contentDark,
  },
  masterFigmaCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: radii.sm,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.contentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  masterAvatar105Wrapper: {
    width: 105,
    height: 105,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: colors.visitGray,
    marginBottom: 12,
  },
  masterAvatar105: {
    width: 105,
    height: 105,
  },
  masterAvatar105Placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterFigmaName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 4,
    textAlign: 'center',
  },
  masterFigmaRole: {
    fontSize: 14,
    color: colors.terracotta,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  masterBadgesStack: {
    width: '100%',
    gap: 10,
    alignItems: 'stretch',
  },
  masterReviewsBadge: {
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceCream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  masterReviewsBadgeText: {
    fontSize: 14,
    color: colors.terracotta,
    fontWeight: '500',
  },
  masterSpecialtyPill: {
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  masterSpecialtyPillText: {
    fontSize: 14,
    color: colors.contentDark,
    fontWeight: '500',
  },
  masterCarouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  masterCircleArrowButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.contentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterSelectCta: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterSelectCtaActive: {
    backgroundColor: colors.terracotta,
  },
  masterSelectCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surfaceCream,
  },
  anyMasterOutlineButton: {
    width: '100%',
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.contentDark,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  anyMasterOutlineButtonActive: {
    borderColor: colors.terracotta,
    backgroundColor: 'rgba(236, 100, 58, 0.05)',
  },
  anyMasterOutlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.contentDark,
  },
  anyMasterOutlineTextActive: {
    color: colors.terracotta,
  },
  stepSubheading: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: -14,
    marginBottom: 16,
  },
  calendarCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: radii.sm,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.contentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  circleNavButton: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.contentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleBold: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.contentDark,
  },
  sevenDaysStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayStripItem: {
    width: 44,
    height: 50,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStripItemSelected: {
    backgroundColor: '#96B3E2',
  },
  dayStripName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.contentDark,
    marginBottom: 2,
  },
  dayStripNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.contentDark,
  },
  dayStripTextSelected: {
    color: colors.surfaceCream,
  },
  timeSlotsTwoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  timeSlotTwoColChip: {
    width: '48%',
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.contentDark,
    backgroundColor: colors.surfaceWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotTwoColChipSelected: {
    backgroundColor: '#96B3E2',
    borderColor: '#96B3E2',
  },
  timeSlotTwoColText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.contentDark,
  },
  timeSlotTwoColTextSelected: {
    color: colors.surfaceWhite,
  },
  summaryFormCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: colors.contentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  summaryFormTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 16,
  },
  summaryFigmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryFigmaRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  summaryCircleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.visitGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryFigmaTextStack: {
    flex: 1,
  },
  summaryFigmaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  summaryFigmaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.contentDark,
  },
  summaryFigmaEditButton: {
    padding: 8,
  },
  summaryFigmaDivider: {
    height: 1,
    backgroundColor: colors.visitGray,
    marginVertical: 4,
  },
  cardFormCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.visitGray,
  },
  cardFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.contentDark,
    marginBottom: 14,
  },
  cardFormField: {
    marginBottom: 12,
  },
  cardFormLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.contentDark,
    marginBottom: 6,
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.visitGray,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceWhite,
  },
  cardTextInput: {
    flex: 1,
    fontSize: 15,
    color: colors.contentDark,
  },
  cardTwoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInputSolo: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.visitGray,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.contentDark,
    backgroundColor: colors.surfaceWhite,
  },
  saveCardCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  saveCardLabel: {
    fontSize: 13,
    color: colors.contentDark,
    flex: 1,
  },
  paymentMethodSubtitleGreen: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
  },
  completedContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  completedCenterCard: {
    width: '100%',
    alignItems: 'center',
  },
  completedIconWrapper: {
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.contentDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  completedSubtitle: {
    fontSize: 14,
    color: colors.contentDark,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  completedActionsStack: {
    width: '100%',
    gap: 12,
  },
  outlineSecondaryButton: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.contentDark,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.contentDark,
  },
});
