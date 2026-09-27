import { useState, useEffect, type FC } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VisitSection, { type VisitData } from '@/features/dashboard/VisitSection';
import GuestBanner from '@/features/dashboard/GuestBanner';
import { supabase } from '@/lib/supabase';
import { formatVisitDateDetails } from '@/features/dashboard/dashboard_utils';

export interface QuickSchedulePageProps {
  isLoggedIn?: boolean;
  onBackClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onHomeClick?: () => void;
  onBookClick?: () => void;
  onToast?: (message: string) => void;
  initialVisit?: VisitData | null;
  isLoading?: boolean;
  onCancelVisit?: (visitId: string) => void | Promise<void>;
  onReschedule?: () => void;
  onQuickBookClick?: () => void;
}

export const QuickSchedulePage: FC<QuickSchedulePageProps> = ({
  isLoggedIn = false,
  onBackClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onHomeClick,
  onBookClick,
  onToast,
  initialVisit,
  isLoading: initialLoading,
  onCancelVisit,
  onReschedule,
  onQuickBookClick,
}) => {
  const [visit, setVisit] = useState<VisitData | null>(
    initialVisit !== undefined ? initialVisit : null
  );
  const [isLoading, setIsLoading] = useState(
    initialLoading !== undefined
      ? initialLoading
      : initialVisit === undefined && isLoggedIn
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoading !== undefined) {
      return;
    }

    if (!isLoggedIn) {
      if (initialVisit === undefined) {
        setVisit(null);
      }
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(initialVisit === undefined);

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
        console.error('Failed to load user visit data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, initialVisit, initialLoading]);

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
          isLoggedIn={isLoggedIn}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onProfileClick={onProfileClick || (() => showToast(''))}
          onNavClick={(nav) => {
            if (nav === 'home' && onHomeClick) {
              onHomeClick();
            }
          }}
          userName={userName}
          userAvatarUrl={userAvatarUrl || '/assets/images/default-avatar.svg'}
        />

        <main className="w-full pt-8">
          <VisitSection
            visit={visit}
            isLoading={isLoading}
            onBackClick={onBackClick}
            onBookClick={onBookClick}
            onReschedule={onReschedule}
            onCancel={handleCancelVisit}
            isCancelling={isCancelling}
          />

          <GuestBanner
            onQuickBookClick={onQuickBookClick || onBookClick}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default QuickSchedulePage;
