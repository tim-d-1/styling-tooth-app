import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import type { CareScheduleItem, CareScheduleNotification } from './pet_types';
import { supabase } from '@/lib/supabase';

export interface PetCareSchedulePageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onPetsClick?: () => void;
  onBookClick?: () => void;
  onAddDocumentClick?: () => void;
  onToast?: (message: string) => void;
  initialNotification?: CareScheduleNotification | null;
  initialItems?: CareScheduleItem[];
  initialDocumentsCount?: number;
}

type FilterCategory = 'all' | 'parasites' | 'vaccines';

const defaultParasiteItems: CareScheduleItem[] = [
  {
    id: 'flea-tick',
    title: 'Від кліщів та бліх',
    badgeText: '✓ Захищено',
    drugName: 'Bravecto',
    validUntilFormatted: 'Наступна: 15 серп.',
    iconName: 'fi-rr-shield-check',
    category: 'parasites',
    statusText: '✓ Захищено',
    statusType: 'success',
  },
  {
    id: 'deworming',
    title: 'Дегельмінтизація',
    badgeText: 'Через 1 міс.',
    drugName: 'Milbemax',
    validUntilFormatted: 'Наступна: 10 вер.',
    iconName: 'fi-rr-medicine',
    category: 'parasites',
    statusText: 'Через 1 міс.',
    statusType: 'neutral',
  },
];

const defaultVaccineItems: CareScheduleItem[] = [
  {
    id: 'core-vaccine',
    title: 'Комплексна вакцинація',
    badgeText: '✓ В нормі',
    drugName: 'Nobivac DHPPi',
    validUntilFormatted: 'Дійсна до 10 груд. 2026',
    iconName: 'fi-rr-syringe',
    category: 'vaccines',
    statusText: '✓ В нормі',
    statusType: 'success',
  },
  {
    id: 'rabies-vaccine',
    title: 'Сказ + лептоспіроз',
    badgeText: '✓ В нормі',
    drugName: 'Nobivac Rabies',
    validUntilFormatted: 'Дійсна до 15 груд. 2026',
    iconName: 'fi-rr-syringe',
    category: 'vaccines',
    statusText: '✓ В нормі',
    statusType: 'success',
  },
];

export const PetCareSchedulePage: FC<PetCareSchedulePageProps> = ({
  onHomeClick,
  onProfileClick,
  onPetsClick,
  onBookClick,
  onAddDocumentClick,
  onToast,
  initialNotification = {
    id: 'notif-1',
    title: 'Найближча обробка',
    drugInfo: 'Обробка від кліщів (Bravecto)',
    dueDateText: 'через 14 днів — 15 Серпня 2026',
    isRead: false,
  },
  initialItems,
  initialDocumentsCount = 2,
}) => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FilterCategory>('all');
  const [notification, setNotification] = useState<CareScheduleNotification | null>(
    initialNotification
  );
  const [documentsCount, setDocumentsCount] = useState<number>(initialDocumentsCount);

  const [items] = useState<CareScheduleItem[]>(
    initialItems || [...defaultParasiteItems, ...defaultVaccineItems]
  );

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

  const handleMarkAsRead = () => {
    setNotification(null);
    showToast('Сповіщення позначено як прочитане');
  };

  const handleAddDocument = () => {
    if (onAddDocumentClick) {
      onAddDocumentClick();
    } else {
      setDocumentsCount((prev) => prev + 1);
      showToast('Додано новий документ');
    }
  };

  const parasiteItems = items.filter((item) => item.category === 'parasites');
  const vaccineItems = items.filter((item) => item.category === 'vaccines');

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
            <span className="text-terracotta font-medium">
              Графік профілактичних обробок
            </span>
          </nav>

          <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
            Графік профілактичних обробок
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 flex flex-col gap-6">
              {notification && !notification.isRead && (
                <div
                  data-testid="upcoming-treatment-notification"
                  className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 flex flex-col gap-4 relative"
                >
                  <span
                    data-testid="unread-indicator"
                    className="w-2.5 h-2.5 rounded-full bg-terracotta absolute top-5 right-5"
                    aria-hidden="true"
                  />

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center shrink-0">
                      <Icon name="fi-rr-clock" size={22} />
                    </div>
                    <div className="flex flex-col pr-4">
                      <h3 className="font-accented font-bold text-base text-content-dark">
                        {notification.title}
                      </h3>
                      <p className="font-primary text-xs text-text-muted mt-0.5">
                        {notification.drugInfo}
                      </p>
                      <p className="font-primary text-xs text-content-dark font-medium mt-0.5">
                        {notification.dueDateText}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMarkAsRead}
                    className="w-full py-3 rounded-xl bg-interactive-lightgray hover:bg-slate-200 text-content-dark font-primary text-sm font-medium transition-colors cursor-pointer outline-none text-center"
                  >
                    Позначити прочитаним
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <h2 className="font-accented font-bold text-xl text-content-dark">
                  Медичні документи
                </h2>

                <div
                  data-testid="medical-documents-card"
                  className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col items-center justify-center text-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center">
                    <Icon name="fi-rr-document" size={28} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="font-accented font-bold text-lg text-content-dark">
                      Ветеринарний паспорт
                    </h3>
                    <p className="font-primary text-sm text-text-muted">
                      {documentsCount > 0
                        ? `Завантажено ${documentsCount} ${
                            documentsCount === 1
                              ? 'файл'
                              : documentsCount >= 2 && documentsCount <= 4
                              ? 'файли'
                              : 'файлів'
                          }`
                        : 'Немає завантажених файлів'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDocument}
                    className="w-full py-3.5 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none"
                  >
                    Додати
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <div
                role="tablist"
                aria-label="Фільтр процедур"
                className="flex items-center bg-interactive-lightgray p-1 rounded-2xl max-w-md w-full gap-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                  className={[
                    'rounded-xl py-2 px-5 flex-1 text-center text-sm transition-all cursor-pointer outline-none font-accented',
                    activeTab === 'all'
                      ? 'bg-white text-content-dark font-semibold shadow-xs'
                      : 'text-content-dark/70 hover:text-content-dark font-medium',
                  ].join(' ')}
                >
                  Всі
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'parasites'}
                  onClick={() => setActiveTab('parasites')}
                  className={[
                    'rounded-xl py-2 px-5 flex-1 text-center text-sm transition-all cursor-pointer outline-none font-accented',
                    activeTab === 'parasites'
                      ? 'bg-white text-content-dark font-semibold shadow-xs'
                      : 'text-content-dark/70 hover:text-content-dark font-medium',
                  ].join(' ')}
                >
                  Паразити
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'vaccines'}
                  onClick={() => setActiveTab('vaccines')}
                  className={[
                    'rounded-xl py-2 px-5 flex-1 text-center text-sm transition-all cursor-pointer outline-none font-accented',
                    activeTab === 'vaccines'
                      ? 'bg-white text-content-dark font-semibold shadow-xs'
                      : 'text-content-dark/70 hover:text-content-dark font-medium',
                  ].join(' ')}
                >
                  Вакцини
                </button>
              </div>

              {(activeTab === 'all' || activeTab === 'parasites') && (
                <section
                  aria-labelledby="parasites-heading"
                  className="flex flex-col gap-4"
                >
                  <h2
                    id="parasites-heading"
                    className="font-accented font-bold text-xl text-content-dark"
                  >
                    Захист від паразитів
                  </h2>

                  <div className="flex flex-col gap-3">
                    {parasiteItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center shrink-0">
                            <Icon name={item.iconName} size={22} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h3 className="font-accented font-semibold text-base text-content-dark">
                              {item.title}
                            </h3>
                            {item.drugName && (
                              <span className="font-primary text-xs text-text-muted">
                                {item.drugName}
                              </span>
                            )}
                            {item.validUntilFormatted && (
                              <span className="font-primary text-xs text-text-muted">
                                {item.validUntilFormatted}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={[
                            'font-primary text-xs sm:text-sm font-medium shrink-0',
                            item.statusType === 'success'
                              ? 'text-status-success'
                              : 'text-content-dark/70',
                          ].join(' ')}
                        >
                          {item.statusText || item.badgeText}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(activeTab === 'all' || activeTab === 'vaccines') && (
                <section
                  aria-labelledby="vaccines-heading"
                  className="flex flex-col gap-4"
                >
                  <h2
                    id="vaccines-heading"
                    className="font-accented font-bold text-xl text-content-dark"
                  >
                    Вакцинація
                  </h2>

                  <div className="flex flex-col gap-3">
                    {vaccineItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-3xl p-5 shadow-sm border border-black/5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center shrink-0">
                            <Icon name={item.iconName} size={22} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h3 className="font-accented font-semibold text-base text-content-dark">
                              {item.title}
                            </h3>
                            {item.drugName && (
                              <span className="font-primary text-xs text-text-muted">
                                {item.drugName}
                              </span>
                            )}
                            {item.validUntilFormatted && (
                              <span className="font-primary text-xs text-text-muted">
                                {item.validUntilFormatted}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={[
                            'font-primary text-xs sm:text-sm font-medium shrink-0',
                            item.statusType === 'success'
                              ? 'text-status-success'
                              : 'text-content-dark/70',
                          ].join(' ')}
                        >
                          {item.statusText || item.badgeText}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PetCareSchedulePage;
