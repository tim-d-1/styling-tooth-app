import { useState, useEffect, type FC } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProfileHero from './ProfileHero';
import ProfileUpcomingVisitCard from './ProfileUpcomingVisitCard';
import LoyaltyCard from './LoyaltyCard';
import MyPetsSection from './MyPetsSection';
import ProfileSettingsSection from './ProfileSettingsSection';
import type { ProfileUser, UpcomingVisitData, ProfilePet } from './profile_types';
import { formatAppointmentDate, formatPetAge } from './profile_utils';
import { supabase } from '@/lib/supabase';
import { resolveLoyaltyTier, calculateCashbackPoints } from '@/config/loyalty';
import { fetchPetsAvatarMap, fetchPetAvatarUrl } from '@/features/pets/pet_media_utils';

export interface ProfilePageProps {
  onHomeClick?: () => void;
  onBookClick?: () => void;
  onAddPetClick?: () => void;
  onPetClick?: (pet: ProfilePet) => void;
  onPersonalInfoClick?: () => void;
  onAddressesClick?: () => void;
  onPaymentMethodsClick?: () => void;
  onViewAllUpcomingClick?: () => void;
  onLoyaltyProgramClick?: () => void;
  onToast?: (message: string) => void;
  initialUser?: ProfileUser;
  initialVisit?: UpcomingVisitData | null;
  initialPets?: ProfilePet[];
  onCancelVisit?: (visitId: string) => void | Promise<void>;
}

export const ProfilePage: FC<ProfilePageProps> = ({
  onHomeClick,
  onBookClick,
  onAddPetClick,
  onPetClick,
  onPersonalInfoClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onViewAllUpcomingClick,
  onLoyaltyProgramClick,
  onToast,
  initialUser,
  initialVisit,
  initialPets,
  onCancelVisit,
}) => {
  const handleViewAllUpcoming = () => {
    if (onViewAllUpcomingClick) {
      onViewAllUpcomingClick();
    }
  };
  const [user, setUser] = useState<ProfileUser>(
    initialUser || {
      name: '',
      phone: '',
      email: '',
      avatarUrl: null,
      loyaltyTier: 'Базовий рівень',
      bonusPoints: 0,
    }
  );

  const [visit, setVisit] = useState<UpcomingVisitData | null>(
    initialVisit !== undefined ? initialVisit : null
  );
  const [isLoadingVisit, setIsLoadingVisit] = useState(initialVisit === undefined);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pets, setPets] = useState<ProfilePet[]>(initialPets || []);
  const [isLoadingPets, setIsLoadingPets] = useState(initialPets === undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        const currentUserId = sessionUser?.id;
        if (!currentUserId || !isMounted) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

      let discountPct = 0;

      if (isMounted) {
        const resolvedName =
          profileData?.full_name?.trim() ||
          sessionUser?.user_metadata?.first_name ||
          sessionUser?.user_metadata?.full_name ||
          (sessionUser?.email ? sessionUser.email.split('@')[0] : '');

        const resolvedPhone =
          profileData?.phone?.trim() ||
          sessionUser?.phone ||
          sessionUser?.user_metadata?.phone ||
          '';

        const rawAvatar =
          profileData?.avatar_url ||
          sessionUser?.user_metadata?.avatar_url ||
          sessionUser?.user_metadata?.picture ||
          null;

        const resolvedAvatar =
          rawAvatar && typeof rawAvatar === 'string' && rawAvatar.trim() && rawAvatar.trim() !== 'null' && rawAvatar.trim() !== 'undefined'
            ? rawAvatar.trim()
            : null;

        discountPct = profileData?.discount_pct ? Number(profileData.discount_pct) : 0;
        const resolvedTier = discountPct > 0 ? `${discountPct}% Знижка` : 'Базовий рівень';

        setUser((prev) => ({
          ...prev,
          name: resolvedName || prev.name,
          phone: resolvedPhone || prev.phone,
          email: profileData?.email || sessionUser?.email || prev.email,
          avatarUrl: resolvedAvatar || prev.avatarUrl,
          loyaltyTier: resolvedTier,
        }));
      }

      const { data: dbPets } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', currentUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (isMounted) {
        if (dbPets && dbPets.length > 0) {
          const avatarMap = await fetchPetsAvatarMap(dbPets.map((p) => p.id));
          if (!isMounted) return;

          setPets(
            dbPets.map((p) => ({
              id: p.id,
              name: p.name,
              species: p.species === 'dog' ? 'Собака' : p.species === 'cat' ? 'Кіт' : 'Інше',
              breed: p.breed || null,
              ageFormatted: formatPetAge(p.birth_date),
              avatarUrl: avatarMap[p.id] || (p as any).avatar_url || null,
              lastVisitFormatted: null,
            }))
          );
        } else if (!initialPets) {
          setPets([]);
        }
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const apptFrom = supabase.from('appointments');
      const { data: dbAppointment } = typeof apptFrom?.select === 'function'
        ? await apptFrom
            .select(`
              id,
              pet_id,
              starts_at,
              price,
              status,
              pet:pets(id, name, species),
              master:masters(display_name),
              service:services!appointments_service_id_fkey(name)
            `)
            .eq('client_id', currentUserId)
            .neq('status', 'cancelled')
            .gte('starts_at', startOfToday.toISOString())
            .order('starts_at', { ascending: true })
            .limit(1)
            .maybeSingle()
        : { data: null };

      if (isMounted) {
        if (dbAppointment) {
          const petRecord = Array.isArray(dbAppointment.pet)
            ? dbAppointment.pet[0]
            : dbAppointment.pet;
          const masterRecord = Array.isArray(dbAppointment.master)
            ? dbAppointment.master[0]
            : dbAppointment.master;
          const serviceRecord = Array.isArray(dbAppointment.service)
            ? dbAppointment.service[0]
            : dbAppointment.service;

          const appointmentPetId = (dbAppointment as any).pet_id || petRecord?.id;
          let apptAvatarUrl: string | null = null;
          if (appointmentPetId) {
            apptAvatarUrl = await fetchPetAvatarUrl(appointmentPetId);
          }

          setVisit({
            id: dbAppointment.id,
            petName: petRecord?.name || 'Улюбленець',
            petAvatarUrl: apptAvatarUrl,
            serviceTitle: serviceRecord?.name || 'Грумінг',
            masterName: masterRecord?.display_name || 'Майстер',
            price: Number(dbAppointment.price) || 0,
            scheduledAtFormatted: formatAppointmentDate(dbAppointment.starts_at),
          });
        } else if (initialVisit === undefined) {
          setVisit(null);
        }

        if (typeof apptFrom?.select === 'function') {
          let completedQuery: any = apptFrom.select('id, price');

          if (typeof completedQuery?.eq === 'function') {
            completedQuery = completedQuery.eq('client_id', currentUserId);
            if (typeof completedQuery?.eq === 'function') {
              completedQuery = completedQuery.eq('status', 'completed');
            }
          }

          const { data: dbCompleted } = (await completedQuery) || {};

          if (isMounted && dbCompleted && Array.isArray(dbCompleted) && dbCompleted.length > 0) {
            const lifetimeSpend = dbCompleted.reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0);
            const tier = resolveLoyaltyTier(lifetimeSpend, discountPct);
            const calculatedPoints = calculateCashbackPoints(lifetimeSpend, tier.cashbackRatePct);

            setUser((prev) => ({
              ...prev,
              loyaltyTier: tier.name,
              bonusPoints: calculatedPoints,
            }));
          }
        }
      }
    } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        if (isMounted) {
          setIsLoadingPets(false);
          setIsLoadingVisit(false);
        }
      }
    }

    loadProfileData();

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingPets(false);
        setIsLoadingVisit(false);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [initialPets, initialVisit]);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  const handleCancelVisit = async () => {
    if (!visit || isCancelling) return;

    if (!visit.id) {
      setVisit(null);
      showToast('Візит скасовано');
      return;
    }

    setIsCancelling(true);
    try {
      if (onCancelVisit) {
        await onCancelVisit(visit.id);
      } else {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', visit.id);

        if (error) {
          showToast(`Помилка скасування: ${error.message}`);
          setIsCancelling(false);
          return;
        }
      }
      setVisit(null);
      showToast('Візит скасовано');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося скасувати візит';
      showToast(`Помилка скасування: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={true}
          activeNav="profile"
          onNavClick={(nav) => {
            if (nav === 'home') {
              onHomeClick?.();
            }
          }}
          onProfileClick={() => showToast('Ви вже в особистому кабінеті')}
          onDeviceClick={() => showToast('Завантажити додаток')}
          onNotificationClick={() => showToast('Немає нових сповіщень')}
          userAvatarUrl={user.avatarUrl || '/assets/images/default-avatar.svg'}
          userName={user.name}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-10">
          <ProfileHero
            userName={user.name}
            onHomeClick={onHomeClick}
            onBookClick={() => {
              if (onBookClick) {
                onBookClick();
              } else {
                showToast('Запис на грумінг');
              }
            }}
          />

          <div className="w-full flex flex-col lg:flex-row items-stretch justify-between gap-6">
            <ProfileUpcomingVisitCard
              visit={visit}
              isLoading={isLoadingVisit}
              isCancelling={isCancelling}
              onCancel={handleCancelVisit}
              onReschedule={() => showToast('Перенесення візиту')}
              onViewAllUpcoming={handleViewAllUpcoming}
            />

            <LoyaltyCard
              user={user}
              onLoyaltyClick={() => {
                if (onLoyaltyProgramClick) {
                  onLoyaltyProgramClick();
                } else {
                  showToast(`Картка лояльності: ${user.bonusPoints} бонусів`);
                }
              }}
            />
          </div>

          <MyPetsSection
            pets={pets}
            isLoading={isLoadingPets}
            onAddPetClick={onAddPetClick}
            onPetClick={(pet) => {
              if (onPetClick) {
                onPetClick(pet);
              } else {
                showToast(`Улюбленець: ${pet.name}`);
              }
            }}
          />

          <ProfileSettingsSection
            onSelectSetting={(settingId) => {
              if (settingId === 'personal_info' && onPersonalInfoClick) {
                onPersonalInfoClick();
                return;
              }
              if (settingId === 'addresses' && onAddressesClick) {
                onAddressesClick();
                return;
              }
              if (settingId === 'payment_methods' && onPaymentMethodsClick) {
                onPaymentMethodsClick();
                return;
              }
              showToast(`Налаштування: ${settingId}`);
            }}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
