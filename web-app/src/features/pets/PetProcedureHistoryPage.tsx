import { useState, useEffect, useMemo, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import type { PetProcedureHistory, ProcedureHistorySummary } from './pet_types';
import { supabase } from '@/lib/supabase';

export interface PetProcedureHistoryPageProps {
  petId?: string;
  petName?: string;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onPetsClick?: () => void;
  onBookClick?: (procedure?: PetProcedureHistory) => void;
  onRepeatVisitClick?: (procedure: PetProcedureHistory) => void;
  onToast?: (message: string) => void;
  initialProcedures?: PetProcedureHistory[];
  initialSummary?: ProcedureHistorySummary;
}

type CategoryType = 'all' | 'grooming' | 'spa' | 'transfer' | 'payment';
type SortOrderType = 'newest' | 'oldest' | 'price_desc' | 'price_asc';

const defaultProcedures: PetProcedureHistory[] = [
  {
    id: 'proc-1',
    serviceTitle: 'СПА-комплекс + Гігієнічна стрижка',
    price: 1450,
    dateFormatted: '20 Липня 2026',
    masterName: 'Анна К.',
    durationFormatted: '2 год 15 хв',
    rating: 5,
    category: 'spa',
    tags: ['Стрижка', 'Купання', 'Ознаки алергії відсутні'],
    beforePhotoUrl: null,
    afterPhotoUrl: null,
  },
  {
    id: 'proc-2',
    serviceTitle: 'Експрес-лінька & Догляд за кігтями',
    price: 950,
    dateFormatted: '12 Травня 2026',
    masterName: 'Олена М.',
    durationFormatted: '1 год 30 хв',
    statusText: 'Завершено',
    category: 'grooming',
    tags: ['Лінька', 'Вичісування', 'Обрізання кігтів', 'Чистка вух', 'Ознаки алергії відсутні'],
    resultPhotoUrl: null,
  },
];

const defaultSummaryData: ProcedureHistorySummary = {
  year: 2026,
  totalProcedures: 12,
  favoriteMaster: 'Анна К.',
};

const categoryTabs: { id: CategoryType; label: string }[] = [
  { id: 'all', label: 'Всі запитання' },
  { id: 'grooming', label: '✂️ Грумінг' },
  { id: 'spa', label: '🫧 СПА & Догляд' },
  { id: 'transfer', label: '🚗 Pet-трансфер' },
  { id: 'payment', label: '💳 Оплата та Бонуси' },
];

function formatVisitsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${count} візитів`;
  }
  if (mod10 === 1) {
    return `${count} візит`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} візити`;
  }
  return `${count} візитів`;
}

export const PetProcedureHistoryPage: FC<PetProcedureHistoryPageProps> = ({
  onHomeClick,
  onProfileClick,
  onPetsClick,
  onBookClick,
  onRepeatVisitClick,
  onToast,
  initialProcedures,
  initialSummary = defaultSummaryData,
}) => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const [procedures] = useState<PetProcedureHistory[]>(
    initialProcedures || defaultProcedures
  );
  const [summary] = useState<ProcedureHistorySummary>(initialSummary);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [sortBy, setSortBy] = useState<SortOrderType>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId || !isMounted) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!isMounted) return;

      if (profile) {
        const resolvedName =
          profile.full_name ||
          sessionData?.session?.user?.user_metadata?.full_name ||
          '';
        const rawAvatar =
          profile.avatar_url ||
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
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handlePetsClick = () => {
    if (onPetsClick) {
      onPetsClick();
    } else if (petId) {
      navigate(`/pets/${petId}`);
    } else {
      navigate('/profile');
    }
  };

  const handleRepeatVisit = (procedure: PetProcedureHistory) => {
    if (onRepeatVisitClick) {
      onRepeatVisitClick(procedure);
    } else if (onBookClick) {
      onBookClick(procedure);
    } else {
      navigate('/main');
      showToast(`Повторний запис на: ${procedure.serviceTitle}`);
    }
  };

  const filteredProcedures = useMemo(() => {
    let list = [...procedures];

    if (selectedCategory !== 'all') {
      list = list.filter((p) => {
        if (selectedCategory === 'grooming') {
          return (
            p.category === 'grooming' ||
            p.serviceTitle.toLowerCase().includes('стрижка') ||
            p.serviceTitle.toLowerCase().includes('лінька') ||
            p.serviceTitle.toLowerCase().includes('кігт') ||
            p.tags.some((t) =>
              /стрижка|лінька|вичісування|кігт|вух/i.test(t)
            )
          );
        }
        if (selectedCategory === 'spa') {
          return (
            p.category === 'spa' ||
            p.serviceTitle.toLowerCase().includes('спа') ||
            p.serviceTitle.toLowerCase().includes('догляд') ||
            p.tags.some((t) => /купання|спа|догляд/i.test(t))
          );
        }
        if (selectedCategory === 'transfer') {
          return (
            p.category === 'transfer' ||
            p.serviceTitle.toLowerCase().includes('трансфер')
          );
        }
        if (selectedCategory === 'payment') {
          return (
            p.category === 'payment' ||
            p.serviceTitle.toLowerCase().includes('оплата') ||
            p.serviceTitle.toLowerCase().includes('бонус')
          );
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.serviceTitle.toLowerCase().includes(q) ||
          p.masterName.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'newest') {
      return list;
    }
    if (sortBy === 'oldest') {
      return [...list].reverse();
    }
    if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }

    return list;
  }, [procedures, selectedCategory, searchQuery, sortBy]);

  const sortLabelMap: Record<SortOrderType, string> = {
    newest: 'Сортування: Найновіші',
    oldest: 'Сортування: Найстаріші',
    price_desc: 'Сортування: Від дорогих',
    price_asc: 'Сортування: Від дешевих',
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
            } else if (nav === 'services' || nav === 'book') {
              if (onBookClick) {
                onBookClick();
              } else {
                navigate('/main');
              }
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
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
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
            <button
              type="button"
              onClick={handlePetsClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Мої улюбленці
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <span className="text-terracotta font-medium">Історія процедур</span>
          </nav>

          <header className="flex flex-col gap-2">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Історія процедур
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
              <section
                aria-label="Пошук та категорії процедур"
                className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-4"
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Пошук запитання або послуги..."
                    aria-label="Пошук запитання або послуги"
                    className="w-full bg-[#f3f4f6] text-content-dark placeholder:text-text-muted text-sm rounded-full py-2.5 pl-4 pr-10 border border-transparent focus:border-soft-blue focus:bg-white focus:outline-none transition-all"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
                    <Icon name="fi-rr-search" size={16} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1" role="tablist" aria-label="Категорії фільтрації">
                  {categoryTabs.map((tab) => {
                    const isActive = selectedCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        aria-selected={isActive}
                        onClick={() => setSelectedCategory(tab.id)}
                        className={[
                          'w-full py-2.5 px-4 rounded-xl text-center text-sm font-accented transition-colors cursor-pointer outline-none',
                          isActive
                            ? 'bg-soft-blue text-white font-semibold shadow-xs'
                            : 'bg-interactive-lightgray text-content-dark font-medium hover:bg-slate-200',
                        ].join(' ')}
                      >
                        {tab.label}
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
                  Підсумок за {summary.year} рік
                </h2>

                <div className="flex flex-col gap-3 font-primary text-sm text-content-dark">
                  <div className="flex items-center gap-3">
                    <div className="text-terracotta flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-checkbox" size={18} />
                    </div>
                    <span>
                      Пройдено процедур:{' '}
                      <strong className="font-semibold">{summary.totalProcedures}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-terracotta flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-heart" size={18} />
                    </div>
                    <span>
                      Улюблений майстер:{' '}
                      <strong className="font-semibold">{summary.favoriteMaster}</strong>
                    </span>
                  </div>
                </div>
              </section>
            </aside>

            <section
              aria-label="Список завершених візитів"
              className="lg:col-span-8 flex flex-col gap-6 w-full"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-accented font-medium text-base text-content-dark">
                  Показано {formatVisitsCountLabel(filteredProcedures.length)}
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
                    <span>{sortLabelMap[sortBy]}</span>
                    <Icon
                      name={isSortOpen ? 'fi-rr-angle-small-up' : 'fi-rr-angle-small-down'}
                      size={16}
                    />
                  </button>

                  {isSortOpen && (
                    <div
                      role="listbox"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-black/5 py-2 z-20 flex flex-col"
                    >
                      {(
                        [
                          ['newest', 'Найновіші'],
                          ['oldest', 'Найстаріші'],
                          ['price_desc', 'За вартістю (спад.)'],
                          ['price_asc', 'За вартістю (зрост.)'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          role="option"
                          type="button"
                          aria-selected={sortBy === key}
                          onClick={() => {
                            setSortBy(key);
                            setIsSortOpen(false);
                          }}
                          className={[
                            'px-4 py-2 text-left text-sm font-primary transition-colors cursor-pointer outline-none',
                            sortBy === key
                              ? 'bg-soft-blue/15 text-content-dark font-semibold'
                              : 'text-content-dark/80 hover:bg-interactive-lightgray',
                          ].join(' ')}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {filteredProcedures.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {filteredProcedures.map((proc) => {
                    const hasSplitPhotos =
                      proc.beforePhotoUrl !== undefined ||
                      proc.afterPhotoUrl !== undefined;
                    const hasSingleResult = Boolean(proc.resultPhotoUrl);

                    return (
                      <article
                        key={proc.id}
                        data-testid={`procedure-item-${proc.id}`}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-accented font-bold text-xl text-content-dark leading-tight">
                            {proc.serviceTitle}
                          </h3>

                          {proc.rating !== undefined && (
                            <span
                              data-testid="procedure-rating-badge"
                              className="bg-soft-blue text-white rounded-full px-3 py-1 font-accented font-semibold text-sm flex items-center gap-1.5 shrink-0 shadow-xs"
                            >
                              <Icon name="fi-rr-star" size={14} />
                              <span>{proc.rating}</span>
                            </span>
                          )}

                          {proc.statusText && !proc.rating && (
                            <span
                              data-testid="procedure-status-badge"
                              className="text-status-success font-accented font-semibold text-sm flex items-center gap-1.5 shrink-0"
                            >
                              <Icon name="fi-rr-check" size={16} />
                              <span>{proc.statusText}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs sm:text-sm text-text-muted font-primary flex-wrap">
                          <div className="w-8 h-8 rounded-full bg-interactive-lightgray text-terracotta flex items-center justify-center shrink-0">
                            <Icon name="fi-rr-calendar" size={16} />
                          </div>
                          <span className="font-semibold text-content-dark">Останній візит</span>
                          <span>•</span>
                          <span>{proc.dateFormatted}</span>
                          <span>•</span>
                          <span>Майстер: {proc.masterName}</span>
                          {proc.durationFormatted && (
                            <>
                              <span>•</span>
                              <span>{proc.durationFormatted}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-semibold text-content-dark">
                            {proc.price.toLocaleString('uk-UA')} грн
                          </span>
                        </div>

                        {proc.tags && proc.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {proc.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-[#9bbad2]/30 text-content-dark font-primary text-xs px-3 py-1 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {hasSingleResult && proc.resultPhotoUrl && (
                          <div className="relative w-full h-[18rem] md:h-[22rem] rounded-2xl overflow-hidden bg-interactive-lightgray border border-black/5">
                            <img
                              src={proc.resultPhotoUrl}
                              alt={`Результат для ${proc.serviceTitle}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <span>Результат ✨</span>
                            </div>
                          </div>
                        )}

                        {(!hasSingleResult || !proc.resultPhotoUrl) && hasSplitPhotos && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative w-full h-[16rem] md:h-[20rem] rounded-2xl overflow-hidden bg-interactive-lightgray flex items-center justify-center border border-black/5">
                              {proc.beforePhotoUrl ? (
                                <img
                                  src={proc.beforePhotoUrl}
                                  alt="Фото до процедури"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-text-muted">
                                  <Icon name="fi-rr-camera" size={32} />
                                  <span className="text-xs font-primary">Фото до процедури</span>
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <span>До 🐾</span>
                              </div>
                            </div>

                            <div className="relative w-full h-[16rem] md:h-[20rem] rounded-2xl overflow-hidden bg-interactive-lightgray flex items-center justify-center border border-black/5">
                              {proc.afterPhotoUrl ? (
                                <img
                                  src={proc.afterPhotoUrl}
                                  alt="Фото після процедури"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-text-muted">
                                  <Icon name="fi-rr-camera" size={32} />
                                  <span className="text-xs font-primary">Фото після процедури</span>
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white font-primary font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <span>Після ✨</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRepeatVisit(proc)}
                          className="w-full py-3.5 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none"
                        >
                          Повторити візит
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  data-testid="empty-procedure-search"
                  className="bg-white rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-black/5 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center">
                    <Icon name="fi-rr-search" size={24} />
                  </div>
                  <h3 className="font-accented font-bold text-lg text-content-dark">
                    Процедур не знайдено
                  </h3>
                  <p className="font-primary text-sm text-text-muted max-w-sm">
                    Спробуйте змінити пошуковий запит або обрати іншу категорію.
                  </p>
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

export default PetProcedureHistoryPage;
