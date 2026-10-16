import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { AppointmentRequest, RequestStatus } from '../admin_types';
import { formatCardDate } from '../admin_date_utils';

export interface RequestCardProps {
  request: AppointmentRequest;
  isSelected?: boolean;
  onSelect?: (request: AppointmentRequest) => void;
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Нова',
  in_progress: 'В процесі',
  confirmed: 'Підтверджено',
  completed: 'Завершена',
  cancelled: 'Скасована',
  no_show: 'Не зʼявився',
  late: 'Запізнення',
};

const STATUS_CLASSES: Record<RequestStatus, string> = {
  new: 'text-[#EB6D48] bg-[#EB6D48]/10',
  in_progress: 'text-[#96B3E2] bg-[#96B3E2]/15',
  confirmed: 'text-[#3B82F6] bg-[#3B82F6]/10',
  completed: 'text-[#34C759] bg-[#34C759]/10',
  cancelled: 'text-content-dark/50 bg-visit-gray',
  no_show: 'text-status-error bg-red-50 border border-red-100',
  late: 'text-amber-700 bg-amber-50',
};

function formatClientShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  }
  return parts[0] || 'Клієнт';
}

function formatPrice(amount: number): string {
  return `${amount.toLocaleString('uk-UA')} ₴`;
}

export const RequestCard: FC<RequestCardProps> = ({
  request,
  isSelected = false,
  onSelect,
}) => {
  const dateInfo = formatCardDate(request.startsAt);
  const isExpired = request.isExpired || (request.status === 'new' && dateInfo.isPast);

  const statusLabel = isExpired
    ? 'Протерміновано'
    : STATUS_LABELS[request.status] || request.status;

  const statusClass = isExpired
    ? 'text-status-error bg-red-50 border border-red-200'
    : STATUS_CLASSES[request.status] || 'text-content-dark/60 bg-visit-gray';

  const clientShort = formatClientShortName(request.client.fullName);

  return (
    <article
      onClick={() => onSelect?.(request)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(request);
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Заявка ${request.appointmentNumber}, ${request.service.name}`}
      className={`rounded-2xl p-5 cursor-pointer transition-all duration-200 outline-none flex flex-col gap-3 ${
        isSelected
          ? 'border-2 border-[#EB6D48] bg-[#FFFBF6] shadow-sm'
          : 'border border-visit-gray/60 bg-white hover:border-visit-gray hover:shadow-xs'
      }`.trim()}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-accented font-bold text-sm text-content-dark/80">
            {request.appointmentNumber}
          </span>
          <span
            className={`flex items-center gap-1 text-[11px] font-primary font-medium px-2 py-0.5 rounded-md ${
              dateInfo.isPast
                ? 'text-red-700 bg-red-50'
                : dateInfo.isToday
                ? 'text-terracotta bg-terracotta/10 font-semibold'
                : 'text-content-dark/60 bg-visit-gray/50'
            }`}
          >
            <Icon name="fi-rr-clock" size={11} />
            <span>{dateInfo.label}</span>
          </span>
        </div>

        <span
          className={`font-primary text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <h3 className="font-accented font-bold text-base text-content-dark leading-snug">
        {request.service.name}
      </h3>

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-visit-gray/40">
        <div className="flex flex-wrap items-center gap-3 text-xs font-primary text-content-dark/70">
          <span className="flex items-center gap-1.5">
            <Icon name="fi-rr-user" size={13} className="text-content-dark/40" />
            <span>{clientShort}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="fi-rr-paw" size={13} className="text-content-dark/40" />
            <span>
              {request.pet.name} ({request.pet.breed})
            </span>
          </span>
        </div>

        <span className="font-accented font-bold text-sm text-content-dark shrink-0">
          {formatPrice(request.price)}
        </span>
      </div>
    </article>
  );
};

export default RequestCard;
