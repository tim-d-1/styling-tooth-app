import { useState, useEffect, useMemo, type FC } from 'react';
import StaffHeader from '@/components/layout/StaffHeader';
import StaffFooter from '@/components/layout/StaffFooter';
import Icon from '@/components/ui/Icon';
import AdminMetricsBar from './components/AdminMetricsBar';
import RequestCard from './components/RequestCard';
import RequestDetailsInspector from './components/RequestDetailsInspector';
import {
  fetchAppointmentRequests,
  fetchMasterRoster,
  calculateMetrics,
  confirmAppointment,
  rejectAppointment,
} from './admin_service';
import type {
  AppointmentRequest,
  DashboardMetrics,
  MasterRosterItem,
  RequestFilter,
} from './admin_types';
import { supabase } from '@/lib/supabase';

export interface RequestProcessingPageProps {
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onNavClick?: (nav: string) => void;
  onNavigateTab?: (tab: 'requests' | 'support') => void;
  onLogout?: () => void;
  onToast?: (message: string) => void;
  initialRequests?: AppointmentRequest[];
  initialMasters?: MasterRosterItem[];
  initialSelectedRequestId?: string;
}

const FILTER_ITEMS: { id: RequestFilter; label: string }[] = [
  { id: 'all', label: 'Всі' },
  { id: 'new', label: 'Нові' },
  { id: 'in_progress', label: 'В обробці' },
  { id: 'completed', label: 'Завершені' },
];

export const RequestProcessingPage: FC<RequestProcessingPageProps> = ({
  onNavClick,
  onNavigateTab,
  onLogout,
  onToast,
  initialRequests,
  initialMasters,
  initialSelectedRequestId,
}) => {
  const [requests, setRequests] = useState<AppointmentRequest[]>(
    initialRequests || []
  );
  const [masters, setMasters] = useState<MasterRosterItem[]>(
    initialMasters || []
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    initialSelectedRequestId || (initialRequests && initialRequests.length > 0 ? initialRequests[0].id : null)
  );
  const [activeFilter, setActiveFilter] = useState<RequestFilter>('all');
  const [isLoading, setIsLoading] = useState(
    initialRequests === undefined || initialMasters === undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRequests, fetchedMasters] = await Promise.all([
        fetchAppointmentRequests(),
        fetchMasterRoster(),
      ]);
      setRequests(fetchedRequests);
      setMasters(fetchedMasters);
      if (fetchedRequests.length > 0) {
        setSelectedRequestId((prev) =>
          prev && fetchedRequests.some((r) => r.id === prev)
            ? prev
            : fetchedRequests[0].id
        );
      } else {
        setSelectedRequestId(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialRequests === undefined || initialMasters === undefined) {
      loadData();
    }
  }, [initialRequests, initialMasters]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-appointments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const metrics: DashboardMetrics = useMemo(() => {
    return calculateMetrics(requests);
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (activeFilter === 'all') return req.status !== 'cancelled';
      if (activeFilter === 'new') return req.status === 'new';
      if (activeFilter === 'in_progress')
        return req.status === 'in_progress' || req.status === 'confirmed';
      if (activeFilter === 'completed') return req.status === 'completed';
      return true;
    });
  }, [requests, activeFilter]);

  useEffect(() => {
    if (
      filteredRequests.length > 0 &&
      (!selectedRequestId ||
        !filteredRequests.some((r) => r.id === selectedRequestId))
    ) {
      setSelectedRequestId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedRequestId]);

  const selectedRequest = useMemo(() => {
    return requests.find((r) => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  const handleConfirm = async (
    appointmentId: string,
    masterId: string,
    proposedTime: string
  ) => {
    setIsSubmitting(true);
    try {
      const result = await confirmAppointment(
        appointmentId,
        masterId,
        proposedTime
      );
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) => {
            if (r.id === appointmentId) {
              const matchedMaster = masters.find((m) => m.id === masterId);
              return {
                ...r,
                status: 'confirmed',
                master: matchedMaster
                  ? {
                      id: matchedMaster.id,
                      displayName: matchedMaster.displayName,
                      avatarUrl: matchedMaster.avatarUrl,
                    }
                  : r.master,
                startsAt: proposedTime || r.startsAt,
              };
            }
            return r;
          })
        );
        onToast?.('Заявку підтверджено та клієнта сповіщено!');
      } else {
        onToast?.(result.error || 'Не вдалося підтвердити заявку');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (appointmentId: string) => {
    setIsSubmitting(true);
    try {
      const result = await rejectAppointment(appointmentId);
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === appointmentId ? { ...r, status: 'cancelled' } : r
          )
        );
        onToast?.('Заявку відхилено');
      } else {
        onToast?.(result.error || 'Не вдалося відхилити заявку');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream flex flex-col font-primary text-content-dark selection:bg-brand-coral/20">
      <StaffHeader
        activeTab="requests"
        onNavigateTab={(tab) => onNavigateTab ? onNavigateTab(tab) : onNavClick?.(tab === 'requests' ? 'admin/requests' : 'admin/support')}
        onLogout={onLogout || (() => {})}
      />

      <main className="flex-1 w-full max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-accented font-bold text-3xl sm:text-4xl text-content-dark tracking-tight">
            Обробка заявок
          </h1>
        </div>

        <AdminMetricsBar metrics={metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section
            aria-label="Список заявок"
            className="lg:col-span-7 bg-white rounded-3xl border border-visit-gray/60 p-6 flex flex-col gap-5 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-accented font-bold text-xl text-content-dark">
                Заявки
              </h2>
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="font-primary text-xs text-content-dark/60 hover:text-[#EB6D48] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Оновити</span>
                <Icon
                  name="fi-rr-refresh"
                  size={14}
                  className={isLoading ? 'animate-spin' : ''}
                />
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Фільтри заявок"
              className="flex flex-wrap items-center gap-2"
            >
              {FILTER_ITEMS.map((filter) => {
                const isActive = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-full font-primary text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#96B3E2] text-white shadow-xs'
                        : 'bg-visit-gray text-content-dark/70 hover:bg-visit-gray/80 hover:text-content-dark'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 min-h-[16rem]">
              {isLoading && requests.length === 0 ? (
                <div className="py-16 text-center text-content-dark/40 font-primary text-sm flex flex-col items-center gap-3">
                  <Icon name="fi-rr-spinner" size={24} className="animate-spin" />
                  <span>Завантаження заявок...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-16 text-center text-content-dark/50 font-primary text-sm flex flex-col items-center gap-2 bg-[#FFFBF6] rounded-2xl border border-visit-gray/40">
                  <Icon name="fi-rr-inbox" size={28} className="text-content-dark/30" />
                  <span className="font-semibold text-content-dark">
                    Немає заявок
                  </span>
                  <span className="text-xs text-content-dark/60">
                    У цій вкладці наразі немає жодних заявок
                  </span>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    isSelected={req.id === selectedRequestId}
                    onSelect={(selected) => setSelectedRequestId(selected.id)}
                  />
                ))
              )}
            </div>
          </section>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <RequestDetailsInspector
              request={selectedRequest}
              masters={masters}
              isSubmitting={isSubmitting}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          </div>
        </div>
      </main>

      <StaffFooter />
    </div>
  );
};

export default RequestProcessingPage;
