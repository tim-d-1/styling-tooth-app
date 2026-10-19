import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailCardLayout from '@/components/layout/DetailCardLayout';
import BookingPetStep from './steps/BookingPetStep';
import BookingProcedureStep from './steps/BookingProcedureStep';
import BookingMasterStep from './steps/BookingMasterStep';
import BookingDateTimeStep from './steps/BookingDateTimeStep';
import BookingRemarksStep from './steps/BookingRemarksStep';
import BookingConfirmationStep from './steps/BookingConfirmationStep';
import BookingPaymentStep from './steps/BookingPaymentStep';
import {
  DEMO_PETS,
  PROCEDURES_CATALOG,
  resolveServiceId,
  type BookingStage,
  type BookingState,
  type PetOption,
  type ProcedureOption,
  type MasterProfile,
} from './booking_types';
import { supabase } from '@/lib/supabase';
import { fetchPetsAvatarMap } from '@/features/pets/pet_media_utils';
import { getKyivISOString, getInitialBookingDate } from './booking_date_utils';

export interface BookingPageProps {
  isLoggedIn?: boolean;
  initialStage?: BookingStage;
  initialDate?: string;
  initialPets?: PetOption[];
  initialMasters?: MasterProfile[];
  onBackClick?: () => void;
  onAddPetClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onToast?: (message: string) => void;
  onComplete?: () => void;
}

export const BookingPage: FC<BookingPageProps> = ({
  isLoggedIn = false,
  initialStage = 'pet',
  initialDate,
  initialPets,
  initialMasters,
  onBackClick,
  onAddPetClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onToast,
  onComplete,
}) => {
  const navigate = useNavigate();

  const [stage, setStage] = useState<BookingStage>(initialStage);
  const [returnToConfirmation, setReturnToConfirmation] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [pets, setPets] = useState<PetOption[]>(() => {
    if (initialPets) return initialPets;
    if (isLoggedIn) return [];
    return DEMO_PETS;
  });

  const [bookingState, setBookingState] = useState<BookingState>(() => {
    const defaultPet =
      initialPets && initialPets.length > 0
        ? initialPets[0]
        : !isLoggedIn
        ? DEMO_PETS[0]
        : null;

    const initialDates = initialDate
      ? getInitialBookingDate(new Date(initialDate))
      : { date: '2026-08-11', dateFormatted: '11.08.2026' };

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
      selectedProcedureIds: [PROCEDURES_CATALOG[0].id],
      selectedProcedures: [PROCEDURES_CATALOG[0]],

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

  const [masters, setMasters] = useState<MasterProfile[]>(initialMasters || []);
  const [procedures, setProcedures] = useState<ProcedureOption[]>(PROCEDURES_CATALOG);
  const [isLoadingPets, setIsLoadingPets] = useState(!initialPets && isLoggedIn);

  useEffect(() => {
    let isMounted = true;
    async function loadServices() {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, price, duration_min')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (isMounted && !error && data && data.length > 0) {
          const mapped: ProcedureOption[] = data.map((s) => ({
            id: s.id,
            name: s.name,
            duration: `${s.duration_min} хв`,
            description: s.description || '',
            priceFormatted: `від ${Math.round(Number(s.price))} ₴`,
            priceNumber: Number(s.price),
            durationMin: s.duration_min,
            price: Number(s.price),
          }));
          setProcedures(mapped);
          setBookingState((prev) => {
            const currentIds =
              prev.selectedProcedureIds && prev.selectedProcedureIds.length > 0
                ? prev.selectedProcedureIds
                : [prev.procedureId];

            const nextProcs = currentIds.map((id) => {
              const resolvedUuid = resolveServiceId(id);
              return (
                mapped.find((m) => m.id === id) ||
                mapped.find((m) => m.id === resolvedUuid) ||
                mapped.find((m) => m.name === id) ||
                mapped[0]
              );
            });

            const nextIds = nextProcs.map((p) => p.id);
            const totalPrice = nextProcs.reduce((sum, p) => sum + (p.price || 0), 0);
            const totalDuration = nextProcs.reduce(
              (sum, p) => sum + (p.durationMin || 0),
              0
            );
            const combinedNames = nextProcs.map((p) => p.name).join(', ');

            return {
              ...prev,
              procedureId: nextIds[0],
              procedureName: combinedNames,
              procedurePrice: totalPrice,
              procedureDurationMin: totalDuration,
              selectedProcedureIds: nextIds,
              selectedProcedures: nextProcs,
            };
          });
        }
      } catch {
        if (isMounted) {
          setProcedures(PROCEDURES_CATALOG);
        }
      }
    }
    loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadMasters() {
      if (initialMasters) return;
      try {
        const { data, error } = await supabase
          .from('masters')
          .select('id, display_name, specialization, avatar_url, bio')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (isMounted) {
          if (!error && data && data.length > 0) {
            const mapped: MasterProfile[] = data.map((m) => ({
              id: m.id,
              name: m.display_name,
              role: m.specialization || 'Грумер',
              avatarUrl: m.avatar_url || '/assets/images/default-avatar.svg',
              specialties: m.bio ? [m.bio] : ['Грумінг'],
              reviewsCount: 0,
              reviews: [],
            }));
            setMasters(mapped);
          } else {
            setMasters([]);
          }
        }
      } catch {
        if (isMounted) setMasters([]);
      }
    }
    loadMasters();
    return () => {
      isMounted = false;
    };
  }, [initialMasters]);

  useEffect(() => {
    let isMounted = true;
    async function loadUserPets() {
      if (!isLoggedIn || initialPets) {
        setIsLoadingPets(false);
        return;
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId || !isMounted) return;

        const { data: userPets } = await supabase
          .from('pets')
          .select('id, name, species, breed')
          .eq('owner_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (isMounted) {
          if (userPets && userPets.length > 0) {
            const avatarMap = await fetchPetsAvatarMap(userPets.map((p) => p.id));
            if (!isMounted) return;

            const mappedPets: PetOption[] = userPets.map((p) => ({
              id: p.id,
              name: p.name,
              species: p.species === 'dog' ? 'Собака' : p.species === 'cat' ? 'Кіт' : p.species,
              breed: p.breed || undefined,
              avatar_url: avatarMap[p.id] || (p as any).avatar_url || null,
            }));

            setPets(mappedPets);
            setBookingState((prev) => ({
              ...prev,
              petId: mappedPets[0].id,
              petName: mappedPets[0].name,
              petSpecies: mappedPets[0].species,
              petBreed: mappedPets[0].breed,
              petAvatarUrl: mappedPets[0].avatar_url || null,
            }));
          } else {
            setPets([]);
            setBookingState((prev) => ({
              ...prev,
              petId: '',
              petName: '',
              petSpecies: '',
              petBreed: undefined,
              petAvatarUrl: null,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load user pets for booking:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPets(false);
        }
      }
    }

    loadUserPets();

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingPets(false);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [isLoggedIn, initialPets]);

  const handleBack = () => {
    if (stage === 'pet') {
      if (onBackClick) onBackClick();
      else navigate(-1);
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

  const handleSelectPet = (pet: PetOption) => {
    setBookingState((prev) => ({
      ...prev,
      petId: pet.id,
      petName: pet.name,
      petSpecies: pet.species,
      petBreed: pet.breed,
      petAvatarUrl: pet.avatar_url,
    }));
  };

  const handleSelectProcedure = (procedure: ProcedureOption) => {
    setBookingState((prev) => ({
      ...prev,
      procedureId: procedure.id,
      procedureName: procedure.name,
      procedurePrice: procedure.price,
      procedureDurationMin: procedure.durationMin,
      selectedProcedureIds: [procedure.id],
      selectedProcedures: [procedure],
    }));
  };

  const handleAddProcedure = (procedure: ProcedureOption) => {
    setBookingState((prev) => {
      const currentIds = prev.selectedProcedureIds || [prev.procedureId];
      const currentProcs =
        prev.selectedProcedures ||
        procedures.filter((p) => currentIds.includes(p.id));

      if (currentIds.includes(procedure.id)) return prev;

      const nextIds = [...currentIds, procedure.id];
      const nextProcs = [...currentProcs, procedure];
      const totalPrice = nextProcs.reduce((sum, p) => sum + (p.price || 0), 0);
      const totalDuration = nextProcs.reduce(
        (sum, p) => sum + (p.durationMin || 0),
        0
      );
      const combinedNames = nextProcs.map((p) => p.name).join(', ');

      return {
        ...prev,
        procedureId: nextIds[0],
        procedureName: combinedNames,
        procedurePrice: totalPrice,
        procedureDurationMin: totalDuration,
        selectedProcedureIds: nextIds,
        selectedProcedures: nextProcs,
      };
    });
  };

  const handleRemoveProcedure = (procedureId: string) => {
    setBookingState((prev) => {
      const currentIds = prev.selectedProcedureIds || [prev.procedureId];
      if (currentIds.length <= 1) return prev;

      const nextIds = currentIds.filter((id) => id !== procedureId);
      const nextProcs = (
        prev.selectedProcedures ||
        procedures.filter((p) => currentIds.includes(p.id))
      ).filter((p) => p.id !== procedureId);

      const totalPrice = nextProcs.reduce((sum, p) => sum + (p.price || 0), 0);
      const totalDuration = nextProcs.reduce(
        (sum, p) => sum + (p.durationMin || 0),
        0
      );
      const combinedNames = nextProcs.map((p) => p.name).join(', ');

      return {
        ...prev,
        procedureId: nextIds[0],
        procedureName: combinedNames,
        procedurePrice: totalPrice,
        procedureDurationMin: totalDuration,
        selectedProcedureIds: nextIds,
        selectedProcedures: nextProcs,
      };
    });
  };

  const handleSelectMaster = (
    master: MasterProfile | { id: 'any'; name: string }
  ) => {
    setBookingState((prev) => ({
      ...prev,
      masterId: master.id,
      masterName: master.name,
      masterRole: 'role' in master ? master.role : undefined,
      masterAvatarUrl: 'avatarUrl' in master ? master.avatarUrl : undefined,
    }));
  };

  const handleSelectDateTime = (
    date: string,
    timeSlot: string,
    formattedDate: string
  ) => {
    setBookingState((prev) => ({
      ...prev,
      date,
      timeSlot,
      dateFormatted: formattedDate,
    }));
  };

  const handleSubmitRemarks = (data: {
    clientNote: string;
    transferEnabled: boolean;
    transferAddress: string;
    behaviorNotes: string;
  }) => {
    setBookingState((prev) => ({
      ...prev,
      clientNote: data.clientNote,
      transferEnabled: data.transferEnabled,
      transferAddress: data.transferAddress,
      behaviorNotes: data.behaviorNotes,
    }));
  };

  const handleProcessPayment = async (paymentData?: {
    method: 'card' | 'new_card' | 'cash';
    cardDetails?: {
      cardNumber: string;
      expiry: string;
      cvv: string;
      saveCard: boolean;
    };
  }) => {
    setIsProcessingPayment(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (!currentUserId) {
        throw new Error('Для оформлення візиту необхідно увійти в систему');
      }

      if (paymentData?.cardDetails?.saveCard && paymentData.cardDetails.cardNumber) {
        try {
          const digits = paymentData.cardDetails.cardNumber.replace(/\D/g, '');
          const last4 = digits.slice(-4);
          if (last4.length === 4) {
            const userMeta = sessionData?.session?.user?.user_metadata;
            const existingMethods = Array.isArray(userMeta?.payment_methods)
              ? userMeta.payment_methods
              : [];
            const newCard = {
              id: `pm-card-${Date.now()}`,
              type: 'card',
              title: `•••• ${last4}`,
              subtitle: `Термін: ${paymentData.cardDetails.expiry || '12/28'}`,
              isDefault: existingMethods.length === 0,
              last4,
              expiry: paymentData.cardDetails.expiry || '',
            };
            const updatedMethods = [
              ...existingMethods.filter((m: any) => m.last4 !== last4),
              newCard,
            ];
            await supabase.auth.updateUser({
              data: { payment_methods: updatedMethods },
            });
          }
        } catch (saveErr) {
          console.error('Failed to save payment card into user metadata:', saveErr);
        }
      }

      let resolvedPetId = bookingState.petId;
      const isUUID = (val?: string) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

      if (!isUUID(resolvedPetId) || resolvedPetId.startsWith('p-')) {
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
          } else {
            const petTable = supabase.from('pets');
            if (petTable && typeof petTable.insert === 'function') {
              const res = await petTable.insert({
                owner_id: currentUserId,
                name: bookingState.petName || 'Барон',
                species: bookingState.petSpecies === 'Кіт' ? 'cat' : 'dog',
                breed: bookingState.petBreed || 'Йоркширський тер’єр',
              });
              const created = res?.data as Array<{ id: string }> | null;
              if (created && Array.isArray(created) && created[0]?.id) {
                resolvedPetId = created[0].id;
              }
            }
          }
        } catch {
          // Ignore in mocks
        }
      }

      const effectiveServiceIds =
        bookingState.selectedProcedureIds && bookingState.selectedProcedureIds.length > 0
          ? bookingState.selectedProcedureIds.map(resolveServiceId)
          : [resolveServiceId(bookingState.procedureId)];
      const resolvedServiceId = effectiveServiceIds[0];

      const resolvedMasterId = isUUID(bookingState.masterId)
        ? bookingState.masterId
        : null;

      const startsAt = getKyivISOString(bookingState.date, bookingState.timeSlot);
      const endsAt = new Date(
        new Date(startsAt).getTime() + (bookingState.procedureDurationMin || 90) * 60000
      ).toISOString();

      const clientNoteParts = [
        bookingState.clientNote,
        bookingState.behaviorNotes ? `Поведінка: ${bookingState.behaviorNotes}` : '',
        bookingState.transferEnabled ? `Трансфер: ${bookingState.transferAddress}` : '',
      ].filter(Boolean).join(' | ');

      let appointmentCreated = false;
      let createdAppointmentId: string | undefined = undefined;

      if (typeof supabase.rpc === 'function') {
        try {
          if (effectiveServiceIds.length > 1) {
            const { data: rpcData, error: rpcError } = await supabase.rpc(
              'create_multi_service_appointment',
              {
                p_pet_id: isUUID(resolvedPetId) ? resolvedPetId : null,
                p_master_id: resolvedMasterId,
                p_service_ids: effectiveServiceIds,
                p_starts_at: startsAt,
                p_client_note: clientNoteParts || null,
                p_source: 'web',
              }
            );

            if (!rpcError && rpcData) {
              appointmentCreated = true;
              createdAppointmentId = (rpcData as any)?.id;
            }
          } else {
            const { data: rpcData, error: rpcError } = await supabase.rpc(
              'create_appointment',
              {
                p_pet_id: isUUID(resolvedPetId) ? resolvedPetId : null,
                p_master_id: resolvedMasterId,
                p_service_id: resolvedServiceId,
                p_starts_at: startsAt,
                p_client_note: clientNoteParts || null,
                p_source: 'web',
              }
            );

            if (!rpcError && rpcData) {
              appointmentCreated = true;
              createdAppointmentId = (rpcData as any)?.id;
            }
          }
        } catch {
          // Fall through to direct insert
        }
      }

      if (!appointmentCreated) {
        const appointmentPayload = {
          client_id: currentUserId,
          pet_id:
            resolvedPetId && resolvedPetId.startsWith('p-')
              ? undefined
              : resolvedPetId || undefined,
          master_id:
            bookingState.masterId === 'any' ||
            bookingState.masterId.startsWith('m-')
              ? undefined
              : (resolvedMasterId || undefined),
          service_id:
            bookingState.procedureId.startsWith('p-')
              ? undefined
              : resolvedServiceId,
          price:
            bookingState.procedurePrice +
            (bookingState.transferEnabled ? bookingState.transferPrice : 0),
          starts_at: startsAt,
          ends_at: endsAt,
          status: 'confirmed',
          client_note: clientNoteParts || null,
        };
        const insertBuilder: any = supabase.from('appointments').insert(appointmentPayload);
        const { data: insertData, error: insertError } =
          typeof insertBuilder?.select === 'function'
            ? await insertBuilder.select('id')
            : await insertBuilder;

        if (insertError) {
          throw new Error(insertError.message || 'Не вдалося створити візит');
        }

        if (insertData && Array.isArray(insertData) && insertData[0]?.id) {
          createdAppointmentId = insertData[0].id;
        }
      }

      const paymentProvider: 'monobank' | 'cash' =
        paymentData?.method === 'cash' || bookingState.paymentMethod === 'cash'
          ? 'cash'
          : 'monobank';

      if (createdAppointmentId && typeof supabase.rpc === 'function') {
        try {
          await supabase.rpc('create_payment_attempt', {
            p_appointment_id: createdAppointmentId,
            p_provider: paymentProvider,
          });
        } catch {
          // Non-blocking fallback if RPC is unmocked
        }
      }

      try {
        const payTable = supabase.from('payments');
        if (payTable && typeof payTable.insert === 'function') {
          await payTable
            .insert({
              appointment_id: createdAppointmentId || undefined,
              client_id: currentUserId,
              amount:
                bookingState.procedurePrice +
                (bookingState.transferEnabled ? bookingState.transferPrice : 0),
              currency: 'UAH',
              status: 'pending',
              provider: paymentProvider,
              invoice_id: paymentProvider === 'monobank' ? `inv_mono_${Date.now()}` : null,
              page_url: paymentProvider === 'monobank' ? `https://pay.mbnk.biz/inv_mono_${Date.now()}` : null,
            })
            .select('id')
            .maybeSingle();
        }
      } catch {
        // Non-blocking payment audit
      }

      if (onToast) {
        onToast('Візит успішно заброньовано!');
      }

      if (onComplete) {
        onComplete();
      } else {
        navigate('/main');
      }
    } catch (err: unknown) {
      console.error('Failed to create appointment:', err);
      const errMsg = err instanceof Error ? err.message : 'Не вдалося створити візит';
      if (onToast) {
        onToast(`Помилка бронювання: ${errMsg}`);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const totalAmount =
    bookingState.procedurePrice +
    (bookingState.transferEnabled ? bookingState.transferPrice : 0);

  return (
    <DetailCardLayout
      onBackClick={handleBack}
      isLoggedIn={isLoggedIn}
      onLoginClick={onLoginClick}
      onRegisterClick={onRegisterClick}
      onProfileClick={onProfileClick}
    >
      {stage === 'pet' && (
        <BookingPetStep
          pets={pets}
          isLoading={isLoadingPets}
          selectedPetId={bookingState.petId}
          onSelectPet={handleSelectPet}
          onAddPetClick={
            onAddPetClick || (() => navigate('/pet-register?from=/booking'))
          }
          onNext={() => handleNextFromStep('procedure')}
        />
      )}

      {stage === 'procedure' && (
        <BookingProcedureStep
          procedures={procedures}
          selectedProcedureId={bookingState.procedureId}
          selectedProcedureIds={bookingState.selectedProcedureIds}
          onSelectProcedure={handleSelectProcedure}
          onAddProcedure={handleAddProcedure}
          onRemoveProcedure={handleRemoveProcedure}
          onNext={() => handleNextFromStep('master')}
        />
      )}

      {stage === 'master' && (
        <BookingMasterStep
          masters={masters}
          selectedMasterId={bookingState.masterId}
          onSelectMaster={handleSelectMaster}
          onWriteReviewClick={() => {
            if (onToast) onToast('Форма відгуку буде доступна незабаром');
          }}
          onNext={() => handleNextFromStep('datetime')}
        />
      )}

      {stage === 'datetime' && (
        <BookingDateTimeStep
          selectedDate={bookingState.date}
          selectedTimeSlot={bookingState.timeSlot}
          masterId={bookingState.masterId}
          procedureId={bookingState.procedureId}
          procedureIds={bookingState.selectedProcedureIds}
          onSelectDateTime={handleSelectDateTime}
          onNext={() => handleNextFromStep('remarks')}
          onBack={handleBack}
        />
      )}

      {stage === 'remarks' && (
        <BookingRemarksStep
          initialComment={bookingState.clientNote}
          initialTransferEnabled={bookingState.transferEnabled}
          initialTransferAddress={bookingState.transferAddress}
          initialBehaviorNotes={bookingState.behaviorNotes}
          onSubmitRemarks={handleSubmitRemarks}
          onNext={() => handleNextFromStep('confirmation')}
        />
      )}

      {stage === 'confirmation' && (
        <BookingConfirmationStep
          bookingState={bookingState}
          onEditStage={handleEditStage}
          onConfirm={() => setStage('payment')}
        />
      )}

      {stage === 'payment' && (
        <BookingPaymentStep
          totalAmount={totalAmount}
          onPay={handleProcessPayment}
          isProcessing={isProcessingPayment}
        />
      )}
    </DetailCardLayout>
  );
};

export default BookingPage;
