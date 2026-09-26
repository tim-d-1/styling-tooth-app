import { useState, useEffect, type FC } from 'react';
import Header from '@/components/layout/Header';
import LocationBar from './LocationBar';
import VisitSection, { type VisitData } from './VisitSection';
import PromoBannersGrid from './PromoBannersGrid';
import ExpertAdviceGrid, { type ArticleItem } from './ExpertAdviceGrid';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { formatVisitDateDetails } from './dashboard_utils';

const EXPERT_ARTICLES: ArticleItem[] = [
  {
    id: 'shampoo-guide',
    title: 'ЯК ОБРАТИ ПРАВИЛЬНИЙ ШАМПУНЬ?',
    bgImage: '/assets/images/golden_retriever_bath.png',
    bgColor: 'var(--color-soft-ice)',
    type: 'shampoo',
  },
  {
    id: 'paws-tips',
    title: '5 ПОРАД',
    subtitle: 'для здорових лап',
    bgImage: '/assets/images/dog_paw_close_up.png',
    bgColor: 'var(--color-soft-blue)',
    type: 'paw',
  },
  {
    id: 'post-walk-care',
    title: 'Як доглядати за шерстю після прогулянок?',
    bgImage: '/assets/images/expert_advice_dog_walk-51ea98.png',
    logo: '/assets/images/expert_advice_logo.png',
    type: 'walk',
  },
];

export interface MainPageProps {
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onToast?: (message: string) => void;
  initialVisit?: VisitData | null;
  onCancelVisit?: (visitId: string) => void | Promise<void>;
}

export const MainPage: FC<MainPageProps> = ({
  isLoggedIn = true,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onToast,
  initialVisit,
  onCancelVisit,
}) => {
  const [visit, setVisit] = useState<VisitData | null>(
    initialVisit !== undefined ? initialVisit : null
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let isMounted = true;

    async function loadUserData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId || !isMounted) return;

      try {
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

        if (initialVisit === undefined) {
          const { data: dbAppointment } = await supabase
            .from('appointments')
            .select(`
              id,
              starts_at,
              price,
              status,
              pet:pets(name, species),
              master:masters(display_name),
              service:services!appointments_service_id_fkey(name)
            `)
            .eq('client_id', currentUserId)
            .neq('status', 'cancelled')
            .gte('starts_at', new Date().toISOString())
            .order('starts_at', { ascending: true })
            .limit(1)
            .maybeSingle();

          if (isMounted) {
            if (dbAppointment) {
              const masterRecord = Array.isArray(dbAppointment.master)
                ? dbAppointment.master[0]
                : dbAppointment.master;
              const serviceRecord = Array.isArray(dbAppointment.service)
                ? dbAppointment.service[0]
                : dbAppointment.service;

              const dateDetails = formatVisitDateDetails(dbAppointment.starts_at);

              setVisit({
                id: dbAppointment.id,
                dayOfWeek: dateDetails.dayOfWeek,
                dayNumber: dateDetails.dayNumber,
                timeSlot: dateDetails.timeSlot,
                masterName: masterRecord?.display_name || 'Марія Шевченко',
                procedureName: serviceRecord?.name || 'Комплексний грумінг',
                basePrice: Number(dbAppointment.price) || 1300,
                transferPrice: 100,
                initialTransferEnabled: false,
              });
            } else {
              setVisit(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, initialVisit]);

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
      <div className="flex-1 pb-12">
        <Header
          isLoggedIn={isLoggedIn}
          activeNav={activeNav}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onNavClick={(nav: string) => setActiveNav(nav)}
          onDeviceClick={() => showToast('')}
          onProfileClick={onProfileClick || (() => showToast(''))}
          userName={userName}
          userAvatarUrl={userAvatarUrl || '/assets/images/default-avatar.svg'}
        />

        <LocationBar
          location="м. Запоріжжя"
          hasNotification={false}
          onNotificationClick={() => showToast('')}
        />

        <VisitSection
          visit={visit}
          isCancelling={isCancelling}
          onBookClick={() => showToast('')}
          onReschedule={() => showToast('')}
          onCancel={handleCancelVisit}
        />

        <PromoBannersGrid
          onBanner1Click={() => showToast('')}
          onBanner2Click={() => showToast('')}
          onBanner3Click={() => showToast('')}
        />

        <ExpertAdviceGrid
          articles={EXPERT_ARTICLES}
          onArticleClick={(articleId) =>
            showToast(`Відкрито статтю: ${articleId}`)
          }
        />
      </div>

      <Footer />
    </div>
  );
};

export default MainPage;
