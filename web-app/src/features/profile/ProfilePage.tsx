import { useState, useEffect, type FC } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProfileHero from './ProfileHero';
import ProfileUpcomingVisitCard from './ProfileUpcomingVisitCard';
import LoyaltyCard from './LoyaltyCard';
import MyPetsSection from './MyPetsSection';
import ProfileSettingsSection from './ProfileSettingsSection';
import type { ProfileUser, UpcomingVisitData, ProfilePet } from './profile_types';
import { supabase } from '@/lib/supabase';

export interface ProfilePageProps {
  onHomeClick?: () => void;
  onBookClick?: () => void;
  onAddPetClick?: () => void;
  onToast?: (message: string) => void;
  initialUser?: ProfileUser;
  initialVisit?: UpcomingVisitData | null;
  initialPets?: ProfilePet[];
}

export const ProfilePage: FC<ProfilePageProps> = ({
  onHomeClick,
  onBookClick,
  onAddPetClick,
  onToast,
  initialUser,
  initialVisit,
  initialPets,
}) => {
  const [user, setUser] = useState<ProfileUser>(
    initialUser || {
      name: 'Катерина',
      phone: '+380 (97) *** ** 42',
      email: '',
      avatarUrl: null,
      loyaltyTier: 'Gold Level • 25% Cashback',
      bonusPoints: 450,
    }
  );

  const [visit, setVisit] = useState<UpcomingVisitData | null | undefined>(
    initialVisit !== undefined
      ? initialVisit
      : {
          id: 'visit-1',
          petName: 'Барон',
          petAvatarUrl: null,
          serviceTitle: 'Комплексний грумінг & СПА',
          masterName: 'Олена М.',
          price: 1200,
          scheduledAtFormatted: 'Субота, 22 Серпня • 14:00',
        }
  );

  const [pets, setPets] = useState<ProfilePet[]>(
    initialPets || [
      {
        id: 'pet-1',
        name: 'Барон',
        species: 'Собака',
        breed: 'Мальтіпу',
        ageFormatted: '2 роки 4 місяці',
        avatarUrl: null,
        lastVisitFormatted: '18 лип',
      },
      {
        id: 'pet-2',
        name: 'Луна',
        species: 'Кіт',
        breed: 'Перська кішка',
        ageFormatted: '5 років',
        avatarUrl: null,
        lastVisitFormatted: '02 чер',
      },
    ]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId || !isMounted) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (profileData && isMounted) {
        setUser((prev) => ({
          ...prev,
          name: profileData.full_name || prev.name,
          phone: profileData.phone || prev.phone,
          email: profileData.email || prev.email,
          avatarUrl: profileData.avatar_url || prev.avatarUrl,
        }));
      }

      const { data: dbPets } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', currentUserId)
        .eq('is_active', true);

      if (dbPets && dbPets.length > 0 && isMounted) {
        setPets(
          dbPets.map((p) => ({
            id: p.id,
            name: p.name,
            species: p.species === 'dog' ? 'Собака' : p.species === 'cat' ? 'Кіт' : 'Інше',
            breed: p.breed,
            avatarUrl: null,
            lastVisitFormatted: null,
          }))
        );
      }
    }

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
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
              onCancel={() => {
                setVisit(null);
                showToast('Візит скасовано');
              }}
              onReschedule={() => showToast('Перенесення візиту')}
              onBookClick={onBookClick}
            />

            <LoyaltyCard
              user={user}
              onLoyaltyClick={() => showToast(`Картка лояльності: ${user.bonusPoints} бонусів`)}
            />
          </div>

          <MyPetsSection
            pets={pets}
            onAddPetClick={onAddPetClick}
            onPetClick={(pet) => showToast(`Улюбленець: ${pet.name}`)}
          />

          <ProfileSettingsSection
            onSelectSetting={(settingId) => showToast(`Налаштування: ${settingId}`)}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProfilePage;
