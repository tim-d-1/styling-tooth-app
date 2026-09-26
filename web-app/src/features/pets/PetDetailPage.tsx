import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import PetProfileCard from './PetProfileCard';
import PetHealthAlertCard from './PetHealthAlertCard';
import PetCareScheduleCard from './PetCareScheduleCard';
import PetProcedureHistoryCard from './PetProcedureHistoryCard';
import type {
  PetDetail,
  PetSwitcherItem,
  CareScheduleItem,
  PetProcedureHistory,
} from './pet_types';
import { getSpeciesEmoji, formatDateToUkrainian } from './pet_utils';
import { formatPetAge } from '@/features/profile/profile_utils';
import { supabase } from '@/lib/supabase';

export interface PetDetailPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onAddPetClick?: () => void;
  onBookClick?: (petId?: string) => void;
  onRecommendationsClick?: (petId?: string) => void;
  onScheduleClick?: (petId?: string) => void;
  onHistoryClick?: (petId?: string) => void;
  onEditPetClick?: (petId: string) => void;
  onToast?: (message: string) => void;
  initialPets?: PetSwitcherItem[];
  initialPetDetail?: PetDetail | null;
  initialHistory?: PetProcedureHistory | null;
  initialSchedule?: CareScheduleItem[];
}

export const PetDetailPage: FC<PetDetailPageProps> = ({
  onHomeClick,
  onProfileClick,
  onAddPetClick,
  onBookClick,
  onRecommendationsClick,
  onScheduleClick,
  onHistoryClick,
  onEditPetClick,
  onToast,
  initialPets,
  initialPetDetail,
  initialHistory,
  initialSchedule,
}) => {
  const { petId: paramPetId } = useParams<{ petId: string }>();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const [petsList, setPetsList] = useState<PetSwitcherItem[]>(initialPets || []);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(
    paramPetId || (initialPets && initialPets.length > 0 ? initialPets[0].id : null)
  );

  const [petDetail, setPetDetail] = useState<PetDetail | null>(
    initialPetDetail !== undefined ? initialPetDetail : null
  );
  const [history, setHistory] = useState<PetProcedureHistory | null>(
    initialHistory !== undefined ? initialHistory : null
  );
  const [schedule] = useState<CareScheduleItem[] | undefined>(initialSchedule);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  useEffect(() => {
    if (paramPetId) {
      setSelectedPetId(paramPetId);
    }
  }, [paramPetId]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId || !isMounted) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUserId)
        .maybeSingle();

      if (isMounted) {
        const resolvedName =
          profile?.full_name?.trim() ||
          sessionData?.session?.user?.user_metadata?.first_name ||
          sessionData?.session?.user?.user_metadata?.full_name ||
          sessionData?.session?.user?.user_metadata?.name ||
          '';

        const rawAvatar =
          profile?.avatar_url ||
          sessionData?.session?.user?.user_metadata?.avatar_url ||
          sessionData?.session?.user?.user_metadata?.picture ||
          null;

        const resolvedAvatar =
          rawAvatar &&
          typeof rawAvatar === 'string' &&
          rawAvatar.trim() &&
          rawAvatar.trim() !== 'null' &&
          rawAvatar.trim() !== 'undefined'
            ? rawAvatar.trim()
            : null;

        if (resolvedName) setUserName(resolvedName);
        if (resolvedAvatar) setUserAvatarUrl(resolvedAvatar);
      }

      const { data: dbPets } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', currentUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      if (dbPets && dbPets.length > 0) {
        const switcherItems: PetSwitcherItem[] = dbPets.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          isActive: false,
        }));

        let activeId = paramPetId;
        if (!activeId || !switcherItems.some((item) => item.id === activeId)) {
          activeId = switcherItems[0].id;
        }

        setSelectedPetId(activeId);
        setPetsList(
          switcherItems.map((item) => ({
            ...item,
            isActive: item.id === activeId,
          }))
        );

        const currentDbPet = dbPets.find((p) => p.id === activeId) || dbPets[0];

        const { count: visitsCount } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('pet_id', currentDbPet.id)
          .neq('status', 'cancelled');

        const { data: latestAppointment } = await supabase
          .from('appointments')
          .select(`
            id,
            starts_at,
            price,
            status,
            service:services!appointments_service_id_fkey(name),
            master:masters(display_name)
          `)
          .eq('pet_id', currentDbPet.id)
          .neq('status', 'cancelled')
          .order('starts_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: mediaItems } = await supabase
          .from('pet_media')
          .select('*')
          .eq('pet_id', currentDbPet.id);

        if (!isMounted) return;

        let beforeUrl: string | null = null;
        let afterUrl: string | null = null;
        let generalAvatarUrl: string | null = null;

        if (mediaItems && mediaItems.length > 0) {
          for (const item of mediaItems) {
            let itemUrl: string | null = null;
            try {
              const { data: signedData } = await supabase.storage
                .from('pet-media')
                .createSignedUrl(item.storage_path, 3600);
              itemUrl = signedData?.signedUrl || null;
            } catch {
              itemUrl = null;
            }

            if (!itemUrl) {
              itemUrl = supabase.storage
                .from('pet-media')
                .getPublicUrl(item.storage_path).data.publicUrl;
            }

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
          id: currentDbPet.id,
          name: currentDbPet.name,
          species: currentDbPet.species,
          breed: currentDbPet.breed || null,
          birthDate: currentDbPet.birth_date || null,
          ageFormatted: formatPetAge(currentDbPet.birth_date),
          weightKg: currentDbPet.weight_kg ? Number(currentDbPet.weight_kg) : null,
          behaviorNotes: currentDbPet.behavior_notes || null,
          medicalNotes: currentDbPet.medical_notes || null,
          avatarUrl: generalAvatarUrl || afterUrl || null,
          visitsCount: totalVisits,
          isVip: totalVisits >= 5,
        });

        if (latestAppointment) {
          const serviceRecord = Array.isArray(latestAppointment.service)
            ? latestAppointment.service[0]
            : latestAppointment.service;
          const masterRecord = Array.isArray(latestAppointment.master)
            ? latestAppointment.master[0]
            : latestAppointment.master;

          setHistory({
            id: latestAppointment.id,
            appointmentId: latestAppointment.id,
            serviceTitle: serviceRecord?.name || 'СПА-комплекс',
            price: Number(latestAppointment.price) || 0,
            dateFormatted: formatDateToUkrainian(latestAppointment.starts_at),
            masterName: masterRecord?.display_name || 'Майстер',
            tags: ['Стрижка', 'Купання', 'Ознаки алергії відсутні'],
            beforePhotoUrl: beforeUrl,
            afterPhotoUrl: afterUrl,
          });
        } else {
          setHistory(null);
        }
      } else if (!initialPets) {
        setPetsList([]);
        setPetDetail(null);
        setHistory(null);
      }
    }

    if (initialPets === undefined || initialPetDetail === undefined) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [paramPetId, initialPets, initialPetDetail]);

  const handleSelectPet = (id: string) => {
    setSelectedPetId(id);
    setPetsList((prev) =>
      prev.map((pet) => ({
        ...pet,
        isActive: pet.id === id,
      }))
    );
    navigate(`/pets/${id}`);
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      navigate('/main');
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  const handleAddPetClick = () => {
    if (onAddPetClick) {
      onAddPetClick();
    } else {
      navigate('/pet-register', {
        state: { from: window.location.pathname },
      });
    }
  };

  const handleScheduleClick = () => {
    if (onScheduleClick) {
      onScheduleClick(petDetail?.id);
    } else if (petDetail?.id) {
      navigate(`/pets/${petDetail.id}/schedule`);
    } else {
      navigate('/pets/schedule');
    }
  };

  const handleHistoryClick = () => {
    if (onHistoryClick) {
      onHistoryClick(petDetail?.id);
    } else if (petDetail?.id) {
      navigate(`/pets/${petDetail.id}/history`);
    } else {
      navigate('/pets/history');
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
              handleHomeClick();
            }
          }}
          onProfileClick={handleProfileClick}
          onDeviceClick={() => showToast('Завантажити додаток')}
          onNotificationClick={() => showToast('Немає нових сповіщень')}
          userAvatarUrl={userAvatarUrl || '/assets/images/default-avatar.svg'}
          userName={userName}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-8">
          <nav
            aria-label="Навігація по сайту"
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted"
          >
            <button
              type="button"
              onClick={handleHomeClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Головна
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <button
              type="button"
              onClick={handleProfileClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Особистий кабінет
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <span className="text-terracotta font-medium">Мої улюбленці</span>
          </nav>

          <div className="flex flex-col gap-6">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Мої улюбленці
            </h1>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {petsList.map((pet) => {
                const isActive = pet.id === selectedPetId || pet.isActive;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => handleSelectPet(pet.id)}
                    className={[
                      'px-5 py-2.5 rounded-full flex items-center gap-2 font-accented font-semibold text-sm md:text-base shrink-0 transition-all cursor-pointer outline-none',
                      isActive
                        ? 'bg-soft-blue text-white shadow-sm'
                        : 'bg-interactive-lightgray hover:bg-slate-200 text-content-dark',
                    ].join(' ')}
                  >
                    <span>{getSpeciesEmoji(pet.species)}</span>
                    <span>{pet.name}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleAddPetClick}
                aria-label="Додати улюбленця"
                className="w-10 h-10 rounded-full border border-gray-300 hover:border-terracotta text-content-dark hover:text-terracotta flex items-center justify-center transition-colors cursor-pointer shrink-0 outline-none"
              >
                <Icon name="fi-rr-plus" size={16} />
              </button>
            </div>
          </div>

          {petDetail ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 flex flex-col gap-6">
                <PetProfileCard
                  pet={petDetail}
                  onEditClick={() => {
                    if (onEditPetClick) {
                      onEditPetClick(petDetail.id);
                    } else {
                      showToast(`Редагувати: ${petDetail.name}`);
                    }
                  }}
                />

                <PetHealthAlertCard
                  medicalNotes={petDetail.medicalNotes}
                  behaviorNotes={petDetail.behaviorNotes}
                />

                <div className="flex flex-col gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (onBookClick) {
                        onBookClick(petDetail.id);
                      } else {
                        navigate('/main');
                      }
                    }}
                    className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none"
                  >
                    Записати на візит
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onRecommendationsClick) {
                        onRecommendationsClick(petDetail.id);
                      } else {
                        showToast(`Рекомендації для ${petDetail.name}`);
                      }
                    }}
                    className="w-full h-12 bg-soft-blue hover:bg-[#85a4d6] text-white font-accented font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none"
                  >
                    Рекомендації
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col gap-6">
                <PetCareScheduleCard
                  scheduleItems={schedule}
                  onDetailsClick={handleScheduleClick}
                />

                <PetProcedureHistoryCard
                  history={history}
                  onDetailsClick={handleHistoryClick}
                />
              </div>
            </div>
          ) : (
            <div
              data-testid="no-pets-state"
              className="w-full bg-white rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 border border-black/5"
            >
              <div className="w-16 h-16 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center">
                <Icon name="fi-rr-paw" size={32} />
              </div>
              <h2 className="font-accented font-bold text-xl text-content-dark">
                У вас ще немає зареєстрованих улюбленців
              </h2>
              <p className="font-primary text-sm text-text-muted max-w-md">
                Додайте свого першого улюбленця, щоб переглядати історію процедур,
                графік обробок та отримувати індивідуальні рекомендації.
              </p>
              <button
                type="button"
                onClick={handleAddPetClick}
                className="mt-2 px-6 h-12 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                Додати улюбленця
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PetDetailPage;
