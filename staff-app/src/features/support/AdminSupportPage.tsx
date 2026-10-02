import { useState, useEffect, useMemo, type FC } from 'react';
import StaffHeader from '@/components/layout/StaffHeader';
import StaffFooter from '@/components/layout/StaffFooter';
import TicketQueueTable from './components/TicketQueueTable';
import StaffChatWorkspace from './components/StaffChatWorkspace';
import CustomerContextCard from './components/CustomerContextCard';
import { supabase } from '@/lib/supabase';
import { getTickets, updateTicketStatus, claimTicket, sendMessage } from '@/features/support/support_store';
import type { SupportTicket, TicketStatus, SupportCategory } from '@/features/support/support_types';

export interface AdminSupportPageProps {
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onNavClick?: (nav: string) => void;
  onNavigateTab?: (tab: 'requests' | 'support') => void;
  onLogout?: () => void;
  onToast?: (message: string) => void;
}

type TabFilter = 'all' | 'active' | 'resolved' | 'closed';

const TAB_FILTERS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'Всі' },
  { id: 'active', label: 'Активні' },
  { id: 'resolved', label: 'Вирішені' },
  { id: 'closed', label: 'Закриті' }
];

const CATEGORY_OPTIONS: { value: SupportCategory; label: string }[] = [
  { value: 'booking', label: 'Запис на прийом' },
  { value: 'services', label: 'Послуги салону' },
  { value: 'payment', label: 'Оплата та бонуси' },
  { value: 'transfer', label: 'Pet-трансфер' },
  { value: 'other', label: 'Інше' },
];

export const AdminSupportPage: FC<AdminSupportPageProps> = ({
  onNavClick,
  onNavigateTab,
  onLogout,
  onToast,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<TabFilter>('active');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'all'>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (e) {
      onToast?.('Помилка завантаження тікетів');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-support-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (urgentOnly && t.urgency !== 'urgent') return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      
      switch (activeTab) {
        case 'active': return t.status === 'in_progress' || t.status === 'waiting';
        case 'resolved': return t.status === 'resolved';
        case 'closed': return t.status === 'closed';
        default: return true;
      }
    });
  }, [tickets, activeTab, urgentOnly, selectedCategory]);

  const selectedTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const handleSendMessage = async (ticketId: string, text: string) => {
    setIsSubmitting(true);
    try {
      await sendMessage(ticketId, text);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    setIsSubmitting(true);
    try {
      await updateTicketStatus(ticketId, status);
      onToast?.('Статус оновлено');
      loadData();
    } catch (e) {
      onToast?.('Помилка оновлення статусу');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (ticketId: string) => {
    setIsSubmitting(true);
    try {
      await claimTicket(ticketId);
      onToast?.('Тікет прийнято в роботу');
      loadData();
    } catch (e) {
      onToast?.('Помилка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream flex flex-col font-primary text-content-dark selection:bg-brand-coral/20">
      <StaffHeader
        activeTab="support"
        onNavigateTab={(tab) => onNavigateTab ? onNavigateTab(tab) : onNavClick?.(tab === 'requests' ? 'admin/requests' : 'admin/support')}
        onLogout={onLogout || (() => {})}
      />

      <main className="flex-1 w-full max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-accented font-bold text-3xl sm:text-4xl text-content-dark tracking-tight">
            Служба підтримки
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-7 bg-white rounded-3xl border border-visit-gray/60 p-6 flex flex-col gap-5 shadow-xs">
            <div className="flex flex-col gap-4">
              <div role="tablist" className="flex flex-wrap items-center gap-2">
                {TAB_FILTERS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full font-primary text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#96B3E2] text-white shadow-xs'
                          : 'bg-visit-gray text-content-dark/70 hover:bg-visit-gray/80 hover:text-content-dark'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={urgentOnly}
                    onChange={(e) => setUrgentOnly(e.target.checked)}
                    className="rounded border-visit-gray text-[#EB6D48] focus:ring-[#EB6D48]"
                  />
                  Тільки термінові
                </label>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as SupportCategory | 'all')}
                  className="text-sm border-visit-gray rounded-lg focus:ring-[#EB6D48] focus:border-[#EB6D48] py-1.5"
                >
                  <option value="all">Всі категорії</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <TicketQueueTable
              tickets={filteredTickets}
              selectedTicketId={selectedTicketId}
              onSelect={(t) => setSelectedTicketId(t.id)}
              isLoading={isLoading}
            />
          </section>

          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            <StaffChatWorkspace
              ticket={selectedTicket}
              onSendMessage={handleSendMessage}
              onStatusChange={handleStatusChange}
              onClaim={handleClaim}
              onToast={onToast}
              isSubmitting={isSubmitting}
            />
            
            {selectedTicket && (
              <CustomerContextCard ticket={selectedTicket} />
            )}
          </div>
        </div>
      </main>

      <StaffFooter />
    </div>
  );
};

export default AdminSupportPage;
