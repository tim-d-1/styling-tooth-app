import { type FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { SupportTicket, TicketStatus } from '@/features/support/support_types';

interface TicketQueueTableProps {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  onSelect: (ticket: SupportTicket) => void;
  isLoading: boolean;
}

const statusConfig: Record<TicketStatus, { label: string; color: string }> = {
  in_progress: { label: 'В обробці', color: 'bg-green-100 text-green-700' },
  waiting: { label: 'Очікує', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Вирішено', color: 'bg-[#96B3E2] text-white' },
  closed: { label: 'Закрито', color: 'bg-visit-gray text-content-dark' }
};

const categoryLabels: Record<string, string> = {
  booking: 'Запис',
  services: 'Послуги',
  payment: 'Оплата',
  transfer: 'Трансфер',
  other: 'Інше',
};

const getRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} год тому`;
  return `${Math.floor(hours / 24)} дн тому`;
};

export const TicketQueueTable: FC<TicketQueueTableProps> = ({
  tickets,
  selectedTicketId,
  onSelect,
  isLoading
}) => {
  if (isLoading && tickets.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-content-dark/40 font-primary text-sm">
        <Icon name="fi-rr-spinner" size={24} className="animate-spin" />
        <span>Завантаження тікетів...</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="py-16 text-center text-content-dark/50 font-primary text-sm flex flex-col items-center gap-2 bg-[#FFFBF6] rounded-2xl border border-visit-gray/40">
        <Icon name="fi-rr-inbox" size={28} className="text-content-dark/30" />
        <span className="font-semibold text-content-dark">Немає тікетів</span>
        <span className="text-xs text-content-dark/60">За цими критеріями не знайдено тікетів</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tickets.map(ticket => {
        const isSelected = ticket.id === selectedTicketId;
        const statusData = statusConfig[ticket.status] || statusConfig.waiting;
        const clientMessage = ticket.messages?.find(m => m.senderRole === 'client');
        const clientName = clientMessage?.senderName || 'Клієнт';

        return (
          <div
            key={ticket.id}
            onClick={() => onSelect(ticket)}
            className={`cursor-pointer rounded-2xl p-4 border transition-all ${
              isSelected
                ? 'border-[#EB6D48] bg-[#FFFBF6] shadow-sm'
                : 'border-visit-gray bg-white hover:border-visit-gray/80 hover:bg-visit-gray/20'
            }`}
          >
            <div className="flex justify-between items-start gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-primary font-bold text-sm text-content-dark">
                  #{ticket.ticketNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[0.625rem] font-semibold ${statusData.color}`}>
                  {statusData.label}
                </span>
                {ticket.urgency === 'urgent' && (
                  <span className="flex items-center gap-1 text-[0.625rem] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    Терміново
                  </span>
                )}
              </div>
              <span className="text-xs text-content-dark/50 whitespace-nowrap">
                {getRelativeTime(ticket.updatedAt)}
              </span>
            </div>
            
            <h3 className="font-accented font-semibold text-content-dark text-base truncate mb-1">
              {ticket.subject}
            </h3>
            
            <div className="flex items-center justify-between mt-3 text-xs text-content-dark/70">
              <div className="flex items-center gap-1.5">
                <Icon name="fi-rr-user" size={14} />
                <span>{clientName}</span>
              </div>
              <div className="px-2 py-1 bg-visit-gray rounded-md">
                {categoryLabels[ticket.category] || ticket.category}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketQueueTable;
