import { useState, useRef, useEffect, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import type { SupportTicket, SupportMessage, TicketStatus } from '@/features/support/support_types';
import { useSupportRealtime } from '@/features/support/use_support_realtime';

interface StaffChatWorkspaceProps {
  ticket: SupportTicket | null;
  onSendMessage: (ticketId: string, text: string) => Promise<void>;
  onStatusChange: (ticketId: string, status: TicketStatus) => Promise<void>;
  onClaim: (ticketId: string) => Promise<void>;
  onToast?: (msg: string) => void;
  isSubmitting: boolean;
}

const statusConfig: Record<TicketStatus, { label: string; color: string }> = {
  in_progress: { label: 'В обробці', color: 'bg-green-100 text-green-700' },
  waiting: { label: 'Очікує', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Вирішено', color: 'bg-[#96B3E2] text-white' },
  closed: { label: 'Закрито', color: 'bg-visit-gray text-content-dark' }
};

const quickReplies = [
  'Вітаю! Чим можу допомогти?',
  'Перевіряю інформацію, зачекайте, будь ласка.',
  'Питання вирішено. Маєте ще запитання?'
];

export const StaffChatWorkspace: FC<StaffChatWorkspaceProps> = ({
  ticket,
  onSendMessage,
  onStatusChange,
  onClaim,
  onToast,
  isSubmitting
}) => {
  const [messageText, setMessageText] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<SupportMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRealtimeMessages([]);
  }, [ticket?.id]);

  useSupportRealtime(ticket?.id ?? null, (msg) => {
    setRealtimeMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  });

  const baseMessages = ticket?.messages || [];
  const realtimeOnly = realtimeMessages.filter(
    (rm) => !baseMessages.some((bm) => bm.id === rm.id)
  );
  const displayMessages = [...baseMessages, ...realtimeOnly];

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length]);

  if (!ticket) {
    return (
      <div className="h-full min-h-[40rem] flex flex-col items-center justify-center bg-white rounded-3xl border border-visit-gray/60 p-6 shadow-xs text-content-dark/50">
        <Icon name="fi-rr-headset" size={48} className="mb-4 text-visit-gray" />
        <p className="font-primary">Виберіть тікет для початку роботи</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!messageText.trim()) return;
    try {
      await onSendMessage(ticket.id, messageText);
      setMessageText('');
    } catch {
      onToast?.('Помилка відправки повідомлення');
    }
  };

  const statusData = statusConfig[ticket.status];

  return (
    <div className="flex flex-col bg-white rounded-3xl border border-visit-gray/60 shadow-xs h-[45rem]">
      <div className="p-4 border-b border-visit-gray/60 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-content-dark">#{ticket.ticketNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusData.color}`}>
              {statusData.label}
            </span>
            {ticket.urgency === 'urgent' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                Терміново
              </span>
            )}
          </div>
          <h3 className="font-accented font-semibold text-content-dark text-lg truncate">
            {ticket.subject}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!ticket.assignedStaffId && (
            <Button
              variant="outline"
              onClick={() => onClaim(ticket.id)}
              disabled={isSubmitting}
            >
              Прийняти
            </Button>
          )}
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(ticket.id, e.target.value as TicketStatus)}
            disabled={isSubmitting}
            className="text-sm border-visit-gray rounded-lg focus:ring-[#EB6D48] focus:border-[#EB6D48]"
          >
            <option value="in_progress">В обробці</option>
            <option value="waiting">Очікує</option>
            <option value="resolved">Вирішено</option>
            <option value="closed">Закрито</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-cream/30">
        {displayMessages.map((msg) => {
          const isStaff = msg.senderRole === 'staff' || msg.senderRole === 'system';
          return (
            <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 ${
                isStaff 
                  ? 'bg-[#96B3E2] text-white rounded-br-none' 
                  : 'bg-white border border-visit-gray/60 text-content-dark rounded-bl-none'
              }`}>
                {!isStaff && <div className="text-xs font-bold mb-1 opacity-70">{msg.senderName}</div>}
                <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                {msg.attachmentUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden max-h-48 border border-black/10">
                    <img
                      src={msg.attachmentUrl}
                      alt="Вкладення"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                <div className="text-[0.625rem] mt-1 opacity-60 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-visit-gray/60 bg-white rounded-b-3xl">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMessageText(reply)}
              className="whitespace-nowrap px-3 py-1 bg-surface-cream text-content-dark/80 rounded-full text-xs hover:bg-[#96B3E2]/20 transition-colors cursor-pointer"
            >
              {reply}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Введіть повідомлення..."
            className="flex-1 resize-none h-10 min-h-[2.5rem] max-h-[8rem] rounded-xl border-visit-gray focus:ring-[#EB6D48] focus:border-[#EB6D48] text-sm p-2"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!messageText.trim() || isSubmitting}
            className="self-end !px-4"
          >
            <Icon name="fi-rr-paper-plane" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffChatWorkspace;
