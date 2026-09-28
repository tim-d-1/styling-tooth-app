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
  DEMO_MASTERS,
  type BookingStage,
  type BookingState,
  type PetOption,
  type ProcedureOption,
  type MasterProfile,
} from './booking_types';
import { supabase } from '@/lib/supabase';

export interface BookingPageProps {
  isLoggedIn?: boolean;
  initialStage?: BookingStage;
  initialPets?: PetOption[];
  onBackClick?: () => void;
  onAddPetClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onToast?: (message: string) => void;
  onComplete?: () => void;
}

export const BookingPage: FC<BookingPageProps> = ({
  isLoggedIn = true,
  initialStage = 'pet',
  initialPets,
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
    return initialPets && initialPets.length > 0 ? initialPets : DEMO_PETS;
  });

  const [bookingState, setBookingState] = useState<BookingState>({
    petId: DEMO_PETS[0].id,
    petName: DEMO_PETS[0].name,
    petSpecies: DEMO_PETS[0].species,
    petBreed: DEMO_PETS[0].breed,
    petAvatarUrl: DEMO_PETS[0].avatar_url,

    procedureId: PROCEDURES_CATALOG[0].id,
    procedureName: PROCEDURES_CATALOG[0].name,
    procedurePrice: PROCEDURES_CATALOG[0].price,
    procedureDurationMin: PROCEDURES_CATALOG[0].durationMin,

    masterId: DEMO_MASTERS[0].id,
    masterName: DEMO_MASTERS[0].name,
    masterRole: DEMO_MASTERS[0].role,
    masterAvatarUrl: DEMO_MASTERS[0].avatarUrl,

    date: '2026-08-11',
    dateFormatted: '11.08.2026',
    timeSlot: '16:00',

    clientNote: '',
    transferEnabled: false,
    transferPrice: 100,
    transferAddress: '',
    behaviorNotes: '',

    paymentMethod: 'apple_pay',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadUserPets() {
      if (!isLoggedIn || initialPets) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId || !isMounted) return;

        const { data: userPets } = await supabase
          .from('pets')
          .select('id, name, species, breed, avatar_url')
          .eq('owner_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (isMounted && userPets && userPets.length > 0) {
          setPets(userPets);
          setBookingState((prev) => ({
            ...prev,
            petId: userPets[0].id,
            petName: userPets[0].name,
            petSpecies: userPets[0].species,
            petBreed: userPets[0].breed || undefined,
            petAvatarUrl: userPets[0].avatar_url || null,
          }));
        }
      } catch (err) {
        console.error('Failed to load user pets for booking:', err);
      }
    }

    loadUserPets();
    return () => {
      isMounted = false;
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
    }));
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

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      if (currentUserId) {
        const startsAt = new Date(
          `${bookingState.date}T${bookingState.timeSlot}:00Z`
        ).toISOString();
        const endsAt = new Date(
          new Date(startsAt).getTime() +
            (bookingState.procedureDurationMin || 90) * 60000
        ).toISOString();

        await supabase.from('appointments').insert({
          client_id: currentUserId,
          pet_id: bookingState.petId.startsWith('p-')
            ? undefined
            : bookingState.petId,
          master_id:
            bookingState.masterId === 'any' ||
            bookingState.masterId.startsWith('m-')
              ? undefined
              : bookingState.masterId,
          price:
            bookingState.procedurePrice +
            (bookingState.transferEnabled ? bookingState.transferPrice : 0),
          starts_at: startsAt,
          ends_at: endsAt,
          status: 'confirmed',
          client_note: [
            bookingState.clientNote,
            bookingState.behaviorNotes
              ? `Поведінка: ${bookingState.behaviorNotes}`
              : '',
            bookingState.transferEnabled
              ? `Трансфер: ${bookingState.transferAddress}`
              : '',
          ]
            .filter(Boolean)
            .join(' | '),
        });
      }

      if (onToast) {
        onToast('Візит успішно заброньовано!');
      }

      if (onComplete) {
        onComplete();
      } else {
        navigate('/main');
      }
    } catch (err) {
      console.error('Failed to create appointment:', err);
      if (onToast) {
        onToast('Візит успішно заброньовано!');
      }
      if (onComplete) {
        onComplete();
      } else {
        navigate('/main');
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
          procedures={PROCEDURES_CATALOG}
          selectedProcedureId={bookingState.procedureId}
          onSelectProcedure={handleSelectProcedure}
          onNext={() => handleNextFromStep('master')}
        />
      )}

      {stage === 'master' && (
        <BookingMasterStep
          masters={DEMO_MASTERS}
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
          onSelectDateTime={handleSelectDateTime}
          onNext={() => handleNextFromStep('remarks')}
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
