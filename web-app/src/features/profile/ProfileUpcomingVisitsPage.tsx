import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import type { UpcomingVisitData, ProfilePet } from './profile_types';
import { formatAppointmentDate } from './profile_utils';
import { supabase } from '@/lib/supabase';

export interface ProfileUpcomingVisitsPageProps {
  initialVisits?: UpcomingVisitData[];
  initialPets?: ProfilePet[];
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onBookClick?: () => void;
  onRescheduleClick?: (visit: UpcomingVisitData) => void;
  onCancelVisit?: (visitId: string) => void | Promise<void>;
  onToast?: (message: string) => void;
}

type SortOrder = 'soonest' | 'latest';

function formatVisitsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${count} запланованих візитів`;
  }
  if (mod10 === 1) {
    return `${count} запланований візит`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} заплановані візити`;
  }
  return `${count} запланованих візитів`;
}

export const ProfileUpcomingVisitsPage: FC<ProfileUpcomingVisitsPageProps> = ({
  initialVisits,
  initialPets,
  onHomeClick,
  onProfileClick,
  onBookClick,
  onRescheduleClick,
  onCancelVisit,
  onToast,
}) => {
  const navigate = useNavigate();

  const [visits, setVisits] = useState<UpcomingVisitData[]>(initialVisits || []);
  const [pets, setPets] = useState<ProfilePet[]>(initialPets || []);
  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const [selectedPetId, setSelectedPetId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('soonest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

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

      if (isMounted && profile) {
        setUserName(
          profile.full_name ||
          sessionData?.session?.user?.user_metadata?.full_name ||
          ''
        );
        setUserAvatarUrl(
          profile.avatar_url ||
          sessionData?.session?.user?.user_metadata?.avatar_url ||
          null
        );
      }

      if (!initialPets) {
        const { data: dbPets } = await supabase
          .from('pets')
          .select('id, name, species, breed, birth_date, avatar_url')
          .eq('owner_id', currentUserId)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (isMounted && dbPets) {
          setPets(
            dbPets.map((p) => ({
              id: p.id,
              name: p.name,
              species: p.species === 'dog' ? 'Собака' : p.species === 'cat' ? 'Кіт' : 'Інше',
              breed: p.breed || null,
              avatarUrl: p.avatar_url || null,
            }))
          );
        }
      }

      if (!initialVisits) {
        const { data: dbAppointments } = await supabase
          .from('appointments')
          .select(`
            id,
            starts_at,
            price,
            status,
            pet:pets(id, name, species, avatar_url),
            master:masters(display_name),
            service:services!appointments_service_id_fkey(name)
          `)
          .eq('client_id', currentUserId)
          .neq('status', 'cancelled')
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true });

        if (isMounted && dbAppointments) {
          const mapped: UpcomingVisitData[] = dbAppointments.map((appt) => {
            const petRec = Array.isArray(appt.pet) ? appt.pet[0] : appt.pet;
            const masterRec = Array.isArray(appt.master) ? appt.master[0] : appt.master;
            const serviceRec = Array.isArray(appt.service) ? appt.service[0] : appt.service;

            return {
              id: appt.id,
              petId: petRec?.id || undefined,
              petName: petRec?.name || 'Улюбленець',
              petAvatarUrl: petRec?.avatar_url || null,
              serviceTitle: serviceRec?.name || 'Грумінг комплекс',
              masterName: masterRec?.display_name || 'Майстер салону',
              price: Number(appt.price) || 0,
              scheduledAtFormatted: appt.starts_at ? formatAppointmentDate(appt.starts_at) : 'Час узгоджується',
              startsAt: appt.starts_at || undefined,
            };
          });

          setVisits(mapped);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialPets, initialVisits]);

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

  const handleBookClick = () => {
    if (onBookClick) {
      onBookClick();
    } else {
      navigate('/main');
      showToast('Запис на процедуру');
    }
  };

  const handleReschedule = (visit: UpcomingVisitData) => {
    if (onRescheduleClick) {
      onRescheduleClick(visit);
    } else {
      showToast(`Перенесення візиту для: ${visit.petName}`);
    }
  };

  const handleCancel = async (visitId: string) => {
    if (cancellingId) return;

    setCancellingId(visitId);
    try {
      if (onCancelVisit) {
        await onCancelVisit(visitId);
      } else {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', visitId);

        if (error) {
          showToast(`Помилка скасування: ${error.message}`);
          return;
        }
      }

      setVisits((prev) => prev.filter((v) => v.id !== visitId));
      showToast('Візит успішно скасовано');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося скасувати візит';
      showToast(`Помилка скасування: ${msg}`);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredVisits = useMemo(() => {
    let result = [...visits];

    if (selectedPetId !== 'all') {
      result = result.filter((v) => v.petId === selectedPetId || v.petName === selectedPetId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.serviceTitle.toLowerCase().includes(q) ||
          v.masterName.toLowerCase().includes(q) ||
          v.petName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return sortOrder === 'soonest' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [visits, selectedPetId, searchQuery, sortOrder]);

  const nearestVisit = useMemo(() => {
    if (visits.length === 0) return null;
    const sorted = [...visits].sort((a, b) => {
      const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return timeA - timeB;
    });
    return sorted[0];
  }, [visits]);

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={true}
          activeNav="profile"
          onNavClick={(nav) => {
            if (nav === 'home') handleHomeClick();
          }}
          onProfileClick={handleProfileClick}
          onDeviceClick={() => showToast('Завантажити додаток')}
          onNotificationClick={() => showToast('Немає нових сповіщень')}
          userAvatarUrl={userAvatarUrl || '/assets/images/default-avatar.svg'}
          userName={userName || 'Користувач'}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-8">
          <nav
            aria-label="Навігація хлібними крихтами"
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
          >
            <button
              type="button"
              onClick={handleHomeClick}
              className="hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Головна
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <button
              type="button"
              onClick={handleProfileClick}
              className="hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Особистий кабінет
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <span className="text-terracotta font-medium">Заплановані візити</span>
          </nav>

          <header className="flex flex-col gap-2">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Заплановані візити
            </h1>
            <p className="font-primary text-sm md:text-base text-text-muted">
              Управління вашими майбутніми записами, перенесення часу або скасування візитів
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
              <section
                aria-label="Пошук та фільтр улюбленців"
                className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4"
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Пошук послуги, майстра..."
                    aria-label="Пошук запланованого візиту"
                    className="w-full bg-[#f3f4f6] text-content-dark placeholder:text-text-muted text-sm rounded-full py-2.5 pl-4 pr-10 border border-transparent focus:border-soft-blue focus:bg-white focus:outline-none transition-all"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
                    <Icon name="fi-rr-search" size={16} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1" role="tablist" aria-label="Фільтр за улюбленцем">
                  <button
                    role="tab"
                    type="button"
                    aria-selected={selectedPetId === 'all'}
                    onClick={() => setSelectedPetId('all')}
                    className={[
                      'w-full py-2.5 px-4 rounded-xl text-left text-sm font-accented transition-colors cursor-pointer outline-none flex items-center justify-between',
                      selectedPetId === 'all'
                        ? 'bg-soft-blue text-white font-semibold shadow-xs'
                        : 'bg-interactive-lightgray text-content-dark font-medium hover:bg-slate-200',
                    ].join(' ')}
                  >
                    <span>Всі улюбленці</span>
                    <span className="text-xs opacity-80">{visits.length}</span>
                  </button>

                  {pets.map((pet) => {
                    const isActive = selectedPetId === pet.id || selectedPetId === pet.name;
                    const petVisitsCount = visits.filter((v) => v.petId === pet.id || v.petName === pet.name).length;

                    return (
                      <button
                        key={pet.id}
                        role="tab"
                        type="button"
                        aria-selected={isActive}
                        onClick={() => setSelectedPetId(pet.id)}
                        className={[
                          'w-full py-2.5 px-4 rounded-xl text-left text-sm font-accented transition-colors cursor-pointer outline-none flex items-center justify-between',
                          isActive
                            ? 'bg-soft-blue text-white font-semibold shadow-xs'
                            : 'bg-interactive-lightgray text-content-dark font-medium hover:bg-slate-200',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon name="fi-rr-paw" size={14} className="shrink-0" />
                          <span className="truncate">{pet.name}</span>
                        </div>
                        <span className="text-xs opacity-80 shrink-0">{petVisitsCount}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                aria-labelledby="summary-heading"
                className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4"
              >
                <h2
                  id="summary-heading"
                  className="font-accented font-bold text-lg text-content-dark"
                >
                  Підсумок записів
                </h2>

                <div className="flex flex-col gap-3 font-primary text-sm text-content-dark">
                  <div className="flex items-center gap-3">
                    <div className="text-terracotta flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-calendar" size={18} />
                    </div>
                    <span>
                      Заплановано візитів:{' '}
                      <strong className="font-semibold">{visits.length}</strong>
                    </span>
                  </div>

                  {nearestVisit && (
                    <div className="flex items-start gap-3">
                      <div className="text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="fi-rr-clock" size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-text-muted">Найближчий запис:</span>
                        <strong className="font-semibold text-content-dark text-xs sm:text-sm">
                          {nearestVisit.scheduledAtFormatted}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleBookClick}
                  className="w-full mt-2 h-11 px-5 rounded-xl bg-terracotta hover:bg-terracotta-hover active:scale-[0.99] text-white font-accented font-semibold text-sm transition-all shadow-xs cursor-pointer border-0 outline-none flex items-center justify-center gap-2"
                >
                  <Icon name="fi-rr-calendar" size={16} className="text-white" />
                  <span>Записатися на послугу</span>
                </button>
              </section>
            </aside>

            <section
              aria-label="Список запланованих візитів"
              className="lg:col-span-8 flex flex-col gap-6 w-full"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-accented font-medium text-base text-content-dark">
                  Показано {formatVisitsCountLabel(filteredVisits.length)}
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortOpen((prev) => !prev)}
                    aria-expanded={isSortOpen}
                    aria-haspopup="listbox"
                    aria-label="Вибрати сортування візитів"
                    className="bg-soft-blue hover:bg-soft-blue/90 text-white font-accented font-medium text-sm px-5 py-2 rounded-full flex items-center gap-2 cursor-pointer shadow-xs transition-colors outline-none"
                  >
                    <span>
                      {sortOrder === 'soonest' ? 'Спочатку найближчі' : 'Спочатку пізніші'}
                    </span>
                    <Icon name="fi-rr-angle-small-down" size={12} />
                  </button>

                  {isSortOpen && (
                    <div
                      role="listbox"
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-black/5 py-2 z-20 flex flex-col font-primary text-sm text-content-dark"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={sortOrder === 'soonest'}
                        onClick={() => {
                          setSortOrder('soonest');
                          setIsSortOpen(false);
                        }}
                        className={`px-4 py-2 text-left hover:bg-surface-cream transition-colors cursor-pointer border-0 bg-transparent ${
                          sortOrder === 'soonest' ? 'font-semibold text-terracotta' : ''
                        }`}
                      >
                        Спочатку найближчі
                      </button>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sortOrder === 'latest'}
                        onClick={() => {
                          setSortOrder('latest');
                          setIsSortOpen(false);
                        }}
                        className={`px-4 py-2 text-left hover:bg-surface-cream transition-colors cursor-pointer border-0 bg-transparent ${
                          sortOrder === 'latest' ? 'font-semibold text-terracotta' : ''
                        }`}
                      >
                        Спочатку пізніші
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {filteredVisits.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {filteredVisits.map((visit) => {
                    const isItemCancelling = cancellingId === visit.id;

                    return (
                      <article
                        key={visit.id}
                        data-testid={`upcoming-visit-item-${visit.id}`}
                        className="w-full bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col justify-between gap-6"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-accented font-bold text-lg md:text-xl text-content-dark">
                              {visit.petName}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-blue text-white text-xs font-primary">
                            <Icon name="fi-rr-clock" size={12} className="text-white" />
                            <span>{visit.scheduledAtFormatted}</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            {visit.petAvatarUrl ? (
                              <img
                                src={visit.petAvatarUrl}
                                alt={visit.petName}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                data-testid="pet-default-avatar"
                                className="w-14 h-14 rounded-full bg-soft-blue/20 flex items-center justify-center text-terracotta shrink-0"
                              >
                                <Icon name="fi-rr-paw" size={24} />
                              </div>
                            )}

                            <div className="flex flex-col min-w-0">
                              <span className="font-accented font-semibold text-base sm:text-lg text-content-dark truncate">
                                {visit.serviceTitle}
                              </span>
                              <span className="font-primary text-xs sm:text-sm text-content-dark/80">
                                Майстер: {visit.masterName}
                              </span>
                              <span className="font-accented font-bold text-sm sm:text-base text-terracotta mt-0.5">
                                {visit.price.toLocaleString('uk-UA')} грн
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => handleCancel(visit.id)}
                              disabled={isItemCancelling}
                              className="flex-1 sm:flex-initial h-11 px-5 rounded-xl border border-content-dark text-content-dark font-accented font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer bg-transparent outline-none disabled:opacity-50"
                            >
                              {isItemCancelling ? 'Скасування...' : 'Скасувати'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReschedule(visit)}
                              className="flex-1 sm:flex-initial h-11 px-5 rounded-xl bg-terracotta hover:bg-terracotta-hover active:scale-[0.99] text-white font-accented font-semibold text-sm transition-all shadow-xs cursor-pointer border-0 outline-none"
                            >
                              Перенести
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  data-testid="no-upcoming-visits"
                  className="w-full bg-white rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 border border-black/5 shadow-sm"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-cream flex items-center justify-center text-terracotta shadow-xs">
                    <Icon name="fi-rr-calendar" size={28} />
                  </div>
                  <div className="flex flex-col gap-1 max-w-md">
                    <h3 className="font-accented font-bold text-lg text-content-dark">
                      Немає запланованих візитів
                    </h3>
                    <p className="font-primary text-sm text-text-muted">
                      {searchQuery || selectedPetId !== 'all'
                        ? 'За вашими критеріями пошуку не знайдено запланованих візитів.'
                        : 'У вас наразі немає запланованих візитів. Оберіть зручний час для догляду за вашим улюбленцем.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBookClick}
                    className="h-11 px-6 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-accented font-semibold text-sm transition-all shadow-xs cursor-pointer border-0 outline-none"
                  >
                    Записатися на прийом
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProfileUpcomingVisitsPage;
