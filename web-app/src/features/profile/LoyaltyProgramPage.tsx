import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import AppIcon from '@/components/icons';
import type { LoyaltyProgramData, LoyaltyTransaction } from './profile_types';
import { formatAppointmentDate } from './profile_utils';
import { supabase } from '@/lib/supabase';

export interface LoyaltyProgramPageProps {
  initialData?: LoyaltyProgramData;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onToast?: (message: string) => void;
}

type FilterType = 'all' | 'earned' | 'spent';

const defaultTransactions: LoyaltyTransaction[] = [
  {
    id: 'tx-1',
    title: 'Комплексний грумінг (Мальтипу)',
    dateFormatted: '18 Липня 2026',
    points: 240,
    iconName: 'fi-rr-barber-shop',
  },
  {
    id: 'tx-2',
    title: 'Спа + Заспокійлива маска',
    dateFormatted: '02 Липня 2026',
    points: -400,
    iconName: 'fi-rr-spa',
  },
  {
    id: 'tx-3',
    title: 'Експрес-лінька & Догляд за кігтями',
    dateFormatted: '25 Червня 2026',
    points: 60,
    iconName: 'fi-rr-paw',
  },
  {
    id: 'tx-4',
    title: 'Стрижка кігтів',
    dateFormatted: '10 Червня 2026',
    points: -100,
    iconName: 'fi-rr-scissors',
  },
  {
    id: 'tx-5',
    title: 'Озонова ванна + Масаж',
    dateFormatted: '19 Червня 2026',
    points: -200,
    iconName: 'fi-rr-soup',
  },
];

const defaultLoyaltyData: LoyaltyProgramData = {
  balancePoints: 450,
  discountUah: 112,
  tierName: 'Gold Level • 25% Cashback',
  nextTierName: 'До Platinum рівня',
  currentSpendUah: 6800,
  nextTierSpendUah: 7500,
  totalEarnedPoints: 1700,
  totalSpentPoints: 1250,
  privileges: [
    '25% кешбеку з кожної послуги',
    'Пріоритетний запис до топ-майстрів',
    'Безкоштовна спа-маска при комплексному грумінгу',
  ],
  transactions: defaultTransactions,
};

export const LoyaltyProgramPage: FC<LoyaltyProgramPageProps> = ({
  initialData,
  onHomeClick,
  onProfileClick,
  onToast,
}) => {
  const navigate = useNavigate();

  const [loyaltyData, setLoyaltyData] = useState<LoyaltyProgramData>(
    initialData || defaultLoyaltyData
  );

  const [filter, setFilter] = useState<FilterType>('all');
  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

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
        .select('full_name, avatar_url, discount_pct')
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

      if (!initialData) {
        const statsFrom = supabase.from('client_stats');
        const { data: clientStats } = typeof statsFrom?.select === 'function'
          ? await statsFrom.select('*').eq('client_id', currentUserId).maybeSingle()
          : { data: null };

        const apptFrom = supabase.from('appointments');
        let apptQuery: any = typeof apptFrom?.select === 'function'
          ? apptFrom.select(`
            id,
            starts_at,
            price,
            status,
            pet:pets(name),
            service:services!appointments_service_id_fkey(name, category_id)
          `)
          : null;

        if (apptQuery && typeof apptQuery?.eq === 'function') {
          apptQuery = apptQuery.eq('client_id', currentUserId);
          if (typeof apptQuery?.eq === 'function') {
            apptQuery = apptQuery.eq('status', 'completed');
          }
          if (typeof apptQuery?.order === 'function') {
            apptQuery = apptQuery.order('starts_at', { ascending: false });
          }
        }

        const { data: dbAppointments } = (await apptQuery) || {};

        if (isMounted) {
          const discountPct = Number(profile?.discount_pct || 0);
          const completedSpend = dbAppointments && dbAppointments.length > 0
            ? dbAppointments.reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0)
            : Number(clientStats?.lifetime_value || 0);

          let tierName = 'Bronze Level • 10% Cashback';
          let nextTierName = 'До Silver рівня';
          let nextTierSpendUah = 2000;
          let cashbackRate = 10;
          let privileges = [
            '10% кешбеку з кожної послуги',
            'Бонусна програма накопичення',
            'Нагадування про регулярний догляд',
          ];

          if (completedSpend >= 15000 || discountPct >= 25) {
            tierName = 'Platinum Level • 30% Cashback';
            nextTierName = 'Максимальний рівень';
            nextTierSpendUah = 25000;
            cashbackRate = 30;
            privileges = [
              '30% кешбеку з кожної послуги',
              'VIP обслуговування без черги',
              'Безкоштовний трансфер та спа-маска',
            ];
          } else if (completedSpend >= 5000 || discountPct >= 15) {
            tierName = 'Gold Level • 25% Cashback';
            nextTierName = 'До Platinum рівня';
            nextTierSpendUah = 15000;
            cashbackRate = 25;
            privileges = [
              '25% кешбеку з кожної послуги',
              'Пріоритетний запис до топ-майстрів',
              'Безкоштовна спа-маска при комплексному грумінгу',
            ];
          } else if (completedSpend >= 2000 || discountPct >= 10) {
            tierName = 'Silver Level • 15% Cashback';
            nextTierName = 'До Gold рівня';
            nextTierSpendUah = 5000;
            cashbackRate = 15;
            privileges = [
              '15% кешбеку з кожної послуги',
              'Пріоритетний запис',
              'Знижка на засоби догляду',
            ];
          }

          if (dbAppointments && dbAppointments.length > 0) {
            const txList: LoyaltyTransaction[] = dbAppointments.map((appt: any) => {
              const srv = Array.isArray(appt.service) ? appt.service[0] : appt.service;
              const pet = Array.isArray(appt.pet) ? appt.pet[0] : appt.pet;
              const srvTitle = srv?.name ? `${srv.name}${pet?.name ? ` (${pet.name})` : ''}` : 'Грумінг послуга';
              const earned = Math.max(10, Math.round((Number(appt.price) || 0) * (cashbackRate / 100) / 0.25));

              let icon = 'fi-rr-barber-shop';
              const lowTitle = srvTitle.toLowerCase();
              if (lowTitle.includes('спа')) icon = 'fi-rr-spa';
              else if (lowTitle.includes('кігт') || lowTitle.includes('стрижка')) icon = 'fi-rr-scissors';
              else if (lowTitle.includes('ванна') || lowTitle.includes('масаж')) icon = 'fi-rr-soup';
              else if (lowTitle.includes('лінька') || lowTitle.includes('лап')) icon = 'fi-rr-paw';

              return {
                id: `tx-${appt.id}`,
                title: srvTitle,
                dateFormatted: formatAppointmentDate(appt.starts_at),
                points: earned,
                iconName: icon,
              };
            });

            const totalEarned = txList.reduce((acc, t) => acc + (t.points > 0 ? t.points : 0), 0);
            const totalSpent = txList.reduce((acc, t) => acc + (t.points < 0 ? Math.abs(t.points) : 0), 0);
            const balance = Math.max(0, totalEarned - totalSpent);
            const discount = Math.round(balance * 0.25);

            setLoyaltyData({
              balancePoints: balance,
              discountUah: discount,
              tierName,
              nextTierName,
              currentSpendUah: completedSpend,
              nextTierSpendUah,
              totalEarnedPoints: totalEarned,
              totalSpentPoints: totalSpent,
              privileges,
              transactions: txList,
            });
          }
        }
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [initialData]);

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

  const filteredTransactions = useMemo(() => {
    if (filter === 'earned') {
      return loyaltyData.transactions.filter((tx) => tx.points > 0);
    }
    if (filter === 'spent') {
      return loyaltyData.transactions.filter((tx) => tx.points < 0);
    }
    return loyaltyData.transactions;
  }, [loyaltyData.transactions, filter]);

  const progressPercent = Math.min(
    100,
    Math.round(
      (loyaltyData.currentSpendUah / loyaltyData.nextTierSpendUah) * 100
    )
  );

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
            <span className="text-terracotta font-medium">Програма лояльності</span>
          </nav>

          <header className="flex flex-col gap-4">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Програма лояльності
            </h1>

            <aside
              aria-label="Правила нарахування бонусів"
              className="w-full bg-interactive-lightgray rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 text-content-dark font-primary text-sm border border-black/5"
            >
              <div className="text-content-dark flex items-center justify-center shrink-0">
                <Icon name="fi-rr-bulb" size={20} />
              </div>
              <p className="leading-snug">
                1 бонусний бал = 0.25 гривень. Бонуси нараховуються автоматично після кожного оплаченого візиту.
              </p>
            </aside>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-5 flex flex-col gap-6 w-full">
              <article
                aria-label="Картка лояльності"
                className="w-full rounded-3xl p-6 text-white shadow-sm relative overflow-hidden flex flex-col justify-between gap-4 min-h-[18.625rem]"
                style={{
                  background:
                    'linear-gradient(-46deg, rgba(36, 47, 53, 1) 0%, rgba(60, 71, 76, 1) 85%)',
                }}
              >
                <div
                  className="absolute right-[-1rem] bottom-[-1rem] w-48 h-48 pointer-events-none opacity-10 bg-no-repeat bg-contain bg-center"
                  style={{
                    backgroundImage: 'url(/assets/logos/logo-mark-light.svg)',
                  }}
                  aria-hidden="true"
                />

                <div className="flex flex-col gap-3 relative z-10">
                  <h2 className="font-accented font-bold text-xl md:text-2xl text-white">
                    Ваш бонусний баланс:
                  </h2>

                  <div className="flex items-center gap-2">
                    <span className="font-accented font-bold text-3xl sm:text-4xl text-soft-blue leading-none">
                      {loyaltyData.balancePoints.toLocaleString('uk-UA')}
                    </span>
                    <AppIcon name="paws" className="w-8 h-8 bg-soft-blue shrink-0 inline-block" />
                  </div>

                  <p className="font-primary text-xs sm:text-sm text-white/90 leading-snug">
                    = {loyaltyData.discountUah.toLocaleString('uk-UA')} грн знижки на наступний візит або купівлю товарів
                  </p>
                </div>

                <div className="flex flex-col gap-4 pt-2 relative z-10">
                  <div>
                    <span className="inline-block px-3 py-1.5 rounded-full bg-terracotta text-white font-primary font-medium text-xs sm:text-sm shadow-xs">
                      {loyaltyData.tierName}
                    </span>
                  </div>

                  <div className="border-t border-white/20 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-primary text-white">
                      <span>{loyaltyData.nextTierName}</span>
                      <span className="font-medium">
                        {loyaltyData.currentSpendUah}/{loyaltyData.nextTierSpendUah} грн
                      </span>
                    </div>

                    <div
                      role="progressbar"
                      aria-valuenow={loyaltyData.currentSpendUah}
                      aria-valuemin={0}
                      aria-valuemax={loyaltyData.nextTierSpendUah}
                      aria-label="Прогрес до наступного рівня лояльності"
                      className="w-full h-2 rounded-full bg-white/25 overflow-hidden"
                    >
                      <div
                        className="bg-terracotta h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/5 flex flex-col justify-between items-center text-center gap-2 min-h-[6.75rem]">
                  <span className="font-primary font-medium text-xs sm:text-sm text-content-dark">
                    Нараховано за весь час:
                  </span>
                  <div className="flex items-center gap-1.5 text-terracotta font-accented font-bold text-lg sm:text-xl">
                    <span>+{loyaltyData.totalEarnedPoints.toLocaleString('uk-UA')}</span>
                    <AppIcon name="paws" className="w-5 h-5 bg-terracotta shrink-0" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-4 shadow-sm border border-black/5 flex flex-col justify-between items-center text-center gap-2 min-h-[6.75rem]">
                  <span className="font-primary font-medium text-xs sm:text-sm text-content-dark">
                    Витрачено:
                  </span>
                  <div className="flex items-center gap-1.5 text-content-dark font-accented font-bold text-lg sm:text-xl">
                    <span>-{loyaltyData.totalSpentPoints.toLocaleString('uk-UA')}</span>
                    <AppIcon name="paws" className="w-5 h-5 bg-content-dark shrink-0" />
                  </div>
                </div>
              </div>

              <section
                aria-labelledby="privileges-heading"
                className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-5 w-full"
              >
                <h2
                  id="privileges-heading"
                  className="font-accented font-bold text-xl text-content-dark"
                >
                  Привілегії Gold Level 👑
                </h2>

                <ul className="flex flex-col gap-4 font-primary text-sm sm:text-base text-content-dark list-none p-0 m-0">
                  {loyaltyData.privileges.map((privilege, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="text-content-dark flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="fi-rr-checkbox" size={18} />
                      </div>
                      <span className="leading-snug">{privilege}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section
              aria-labelledby="transactions-heading"
              className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-6 w-full min-h-[30rem]"
            >
              <h2
                id="transactions-heading"
                className="font-accented font-bold text-xl md:text-2xl text-content-dark"
              >
                Історія транзакцій
              </h2>

              <div
                role="tablist"
                aria-label="Фільтр історії транзакцій"
                className="flex items-center gap-2 flex-wrap"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'all'}
                  onClick={() => setFilter('all')}
                  className={[
                    'px-5 py-2 rounded-full font-primary font-medium text-sm transition-all cursor-pointer outline-none border-0',
                    filter === 'all'
                      ? 'bg-soft-blue text-white shadow-xs'
                      : 'bg-transparent border border-content-dark text-content-dark hover:bg-slate-100',
                  ].join(' ')}
                >
                  Всі
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'earned'}
                  onClick={() => setFilter('earned')}
                  className={[
                    'px-5 py-2 rounded-full font-primary font-medium text-sm transition-all cursor-pointer outline-none border-0',
                    filter === 'earned'
                      ? 'bg-soft-blue text-white shadow-xs'
                      : 'bg-transparent border border-content-dark text-content-dark hover:bg-slate-100',
                  ].join(' ')}
                >
                  Нараховано
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'spent'}
                  onClick={() => setFilter('spent')}
                  className={[
                    'px-5 py-2 rounded-full font-primary font-medium text-sm transition-all cursor-pointer outline-none border-0',
                    filter === 'spent'
                      ? 'bg-soft-blue text-white shadow-xs'
                      : 'bg-transparent border border-content-dark text-content-dark hover:bg-slate-100',
                  ].join(' ')}
                >
                  Витрачено
                </button>
              </div>

              {filteredTransactions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.points > 0;
                    const formattedPoints = isPositive ? `+${tx.points}` : `${tx.points}`;

                    return (
                      <article
                        key={tx.id}
                        data-testid={`loyalty-tx-${tx.id}`}
                        className="w-full bg-white rounded-2xl p-4 border border-black/5 shadow-xs flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-interactive-lightgray flex items-center justify-center text-content-dark shrink-0">
                            <Icon name={tx.iconName} size={18} />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="font-primary font-medium text-sm sm:text-base text-content-dark truncate">
                              {tx.title}
                            </span>
                            <span className="font-primary text-xs sm:text-sm text-[#B2B2B2]">
                              {tx.dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div
                          className={[
                            'flex items-center gap-1.5 shrink-0 font-accented font-bold text-lg sm:text-xl',
                            isPositive ? 'text-terracotta' : 'text-content-dark',
                          ].join(' ')}
                        >
                          <span>{formattedPoints}</span>
                          <AppIcon
                            name="paws"
                            className={[
                              'w-5 h-5 shrink-0',
                              isPositive ? 'bg-terracotta' : 'bg-content-dark',
                            ].join(' ')}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  data-testid="no-transactions"
                  className="w-full py-12 flex flex-col items-center justify-center text-center gap-2 text-text-muted"
                >
                  <Icon name="fi-rr-clock" size={24} className="text-text-muted opacity-60" />
                  <span className="font-primary text-sm">
                    Немає транзакцій у цій категорії
                  </span>
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

export default LoyaltyProgramPage;
