import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { SupportTicket, SupportCategory } from '../support_types';

export interface TicketSidebarContextProps {
  ticket?: SupportTicket | null;
  className?: string;
}

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  booking: 'Запис на прийом',
  services: 'Послуги салону',
  payment: 'Оплата та бонуси',
  transfer: 'Pet-трансфер',
  other: 'Інше',
};

export const TicketSidebarContext: FC<TicketSidebarContextProps> = ({
  ticket,
  className = '',
}) => {
  const ticketNumberText = ticket?.ticketNumber
    ? `#${ticket.ticketNumber}`
    : '';
  const categoryLabel = ticket?.category
    ? CATEGORY_LABELS[ticket.category] || ticket.category
    : null;

  return (
    <aside
      aria-label="Деталі та контекст звернення"
      className={`w-full lg:w-[24.1875rem] flex flex-col gap-4.5 shrink-0 ${className}`.trim()}
    >
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-visit-gray/60 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-accented font-bold text-lg text-content-dark">
            Деталі звернення {ticketNumberText}
          </h2>
          <span className="bg-[#34C759]/10 text-[#34C759] font-medium text-xs px-2.5 py-1 rounded-full whitespace-nowrap">
            В обробці
          </span>
        </div>

        {ticket?.subject && (
          <p className="font-primary text-sm font-semibold text-content-dark line-clamp-2">
            {ticket.subject}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-visit-gray/40">
          {categoryLabel && (
            <span className="bg-visit-gray text-content-dark/80 text-xs px-2.5 py-1 rounded-full font-medium">
              {categoryLabel}
            </span>
          )}
          {ticket?.urgency === 'urgent' && (
            <span className="bg-[#FF383C]/10 text-[#FF383C] text-xs px-2.5 py-1 rounded-full font-medium">
              Терміново
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-xs border border-visit-gray/60 flex flex-col gap-3">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-content-dark/60">
          Улюбленець
        </h3>
        {ticket?.petName ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-visit-gray bg-surface-cream flex items-center justify-center">
              {ticket.petAvatarUrl ? (
                <img
                  src={ticket.petAvatarUrl}
                  alt={ticket.petName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icon
                  name="fi-rr-paw"
                  size={22}
                  color="var(--color-terracotta)"
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-accented font-bold text-base text-content-dark">
                {ticket.petName}
              </span>
              <span className="font-primary text-xs text-content-dark/70">
                {ticket.petBreed || 'Порода не вказана'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full shrink-0 bg-visit-gray flex items-center justify-center text-content-dark/40">
              <Icon name="fi-rr-paw" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-primary font-medium text-sm text-content-dark">
                Улюбленця не обрано
              </span>
              <span className="font-primary text-xs text-content-dark/60">
                Без прив'язки
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-xs border border-visit-gray/60 flex flex-col gap-3">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-content-dark/60">
          Контекст запису
        </h3>
        {ticket?.appointmentDateFormatted || ticket?.appointmentServices ? (
          <div className="flex flex-col gap-2 font-primary text-sm">
            {ticket.appointmentDateFormatted && (
              <div className="flex items-center gap-2 text-content-dark">
                <Icon
                  name="fi-rr-calendar"
                  size={16}
                  className="text-terracotta shrink-0"
                />
                <span className="font-medium">
                  {ticket.appointmentDateFormatted}
                </span>
              </div>
            )}
            {ticket.appointmentServices && (
              <div className="flex items-center gap-2 text-content-dark/80">
                <Icon
                  name="fi-rr-scissors"
                  size={16}
                  className="text-terracotta shrink-0"
                />
                <span>{ticket.appointmentServices}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-content-dark font-semibold pt-1">
              <span className="text-xs text-content-dark/60">Вартість:</span>
              <span className="text-terracotta font-accented">
                {ticket.appointmentPrice
                  ? `${ticket.appointmentPrice} ₴`
                  : '~ 1 200 ₴'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center text-content-dark/40">
              <Icon name="fi-rr-calendar" size={18} />
            </div>
            <span className="font-primary text-sm text-content-dark/70">
              Запис не обрано
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-xs border border-visit-gray/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-content-dark/60">
            Адреса салону
          </h3>
          <span className="bg-[#34C759]/10 text-[#34C759] font-medium text-xs px-2.5 py-0.5 rounded-full">
            Відчинено зараз
          </span>
        </div>

        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-visit-gray border border-visit-gray/80">
          <img
            src="/assets/images/pet-taxi-route-map.webp"
            alt="Карта салону"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-navy-dark/10 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-terracotta text-white flex items-center justify-center shadow-lg transform -translate-y-1">
              <Icon name="fi-rr-paw" size={18} color="#FFFFFF" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 font-primary text-xs text-content-dark pt-1">
          <div className="flex items-center gap-2">
            <Icon
              name="fi-rr-marker"
              size={15}
              className="text-terracotta shrink-0"
            />
            <span className="font-medium">Київ, Хрещатик, 15</span>
          </div>
          <div className="flex items-center gap-2 text-content-dark/80">
            <Icon
              name="fi-rr-clock"
              size={15}
              className="text-terracotta shrink-0"
            />
            <span>09:00 - 21:00 (Щодня)</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon
              name="fi-rr-phone-call"
              size={15}
              className="text-terracotta shrink-0"
            />
            <a
              href="tel:+380441234567"
              className="text-terracotta font-medium hover:underline"
            >
              +38 (044) 123-45-67
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default TicketSidebarContext;
