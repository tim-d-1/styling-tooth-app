import { useState, useEffect, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import type {
  AppointmentRequest,
  MasterRosterItem,
  RequestStatus,
} from '../admin_types';
import { cleanClientPhone } from '../admin_service';

export interface RequestDetailsInspectorProps {
  request: AppointmentRequest | null;
  masters: MasterRosterItem[];
  isSubmitting?: boolean;
  onConfirm?: (
    appointmentId: string,
    masterId: string,
    proposedTime: string
  ) => void | Promise<void>;
  onReject?: (appointmentId: string) => void | Promise<void>;
  className?: string;
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Нова',
  in_progress: 'В обробці',
  confirmed: 'Підтверджено',
  completed: 'Завершена',
  cancelled: 'Скасована',
};

function formatUkrainianDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const months = [
      'січня',
      'лютого',
      'березня',
      'квітня',
      'травня',
      'червня',
      'липня',
      'серпня',
      'вересня',
      'жовтня',
      'листопада',
      'грудня',
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

function formatInputDateTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

function formatPrice(amount: number): string {
  return `${amount.toLocaleString('uk-UA')} ₴`;
}

export const RequestDetailsInspector: FC<RequestDetailsInspectorProps> = ({
  request,
  masters,
  isSubmitting = false,
  onConfirm,
  onReject,
  className = '',
}) => {
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [proposedDateTime, setProposedDateTime] = useState<string>('');

  useEffect(() => {
    if (request) {
      setSelectedMasterId(
        request.master?.id || (masters.length > 0 ? masters[0].id : '')
      );
      setProposedDateTime(formatInputDateTime(request.startsAt));
    }
  }, [request, masters]);

  if (!request) {
    return (
      <div
        className={`bg-white rounded-3xl border border-visit-gray/60 p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[30rem] ${className}`.trim()}
      >
        <div className="w-14 h-14 rounded-full bg-visit-gray flex items-center justify-center text-content-dark/40">
          <Icon name="fi-rr-inbox" size={26} />
        </div>
        <h3 className="font-accented font-bold text-lg text-content-dark">
          Оберіть заявку
        </h3>
        <p className="font-primary text-sm text-content-dark/60 max-w-xs">
          Виберіть заявку зі списку ліворуч, щоб переглянути деталі, призначити
          майстра та підтвердити візит.
        </p>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[request.status] || request.status;

  const handleConfirm = () => {
    if (!onConfirm) return;
    onConfirm(request.id, selectedMasterId, proposedDateTime || request.startsAt);
  };

  const handleReject = () => {
    if (!onReject) return;
    onReject(request.id);
  };

  return (
    <aside
      aria-label={`Деталі заявки ${request.appointmentNumber}`}
      className={`bg-white rounded-3xl border border-visit-gray/60 p-6 flex flex-col gap-5 ${className}`.trim()}
    >
      <div className="flex items-center justify-between pb-3 border-b border-visit-gray/50">
        <h2 className="font-accented font-bold text-lg text-content-dark">
          Заявка {request.appointmentNumber}
        </h2>
        <span className="font-primary text-xs font-semibold text-[#EB6D48] bg-[#EB6D48]/10 px-3 py-1 rounded-full">
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-visit-gray border border-visit-gray flex items-center justify-center shrink-0">
          {request.client.avatarUrl ? (
            <img
              src={request.client.avatarUrl}
              alt={request.client.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#96B3E2]/20 text-[#96B3E2] flex items-center justify-center font-bold text-base">
              {request.client.fullName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-accented font-bold text-sm text-content-dark truncate">
            {request.client.fullName}
          </span>
          {cleanClientPhone(request.client.phone) ? (
            <a
              href={`tel:${cleanClientPhone(request.client.phone).replace(/[^\d+]/g, '')}`}
              className="font-primary text-xs text-content-dark/60 hover:text-[#EB6D48] transition-colors"
            >
              {cleanClientPhone(request.client.phone)}
            </a>
          ) : (
            <span className="font-primary text-xs text-content-dark/50 italic">
              Номер телефону не вказано
            </span>
          )}
        </div>
      </div>

      <div className="bg-[#FFFBF6] rounded-2xl p-4 border border-visit-gray/60 flex flex-col gap-2">
        <span className="font-primary text-xs font-medium text-content-dark/60">
          Улюбленець
        </span>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-visit-gray/80 flex items-center justify-center shrink-0">
            {request.pet.avatarUrl ? (
              <img
                src={request.pet.avatarUrl}
                alt={request.pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon name="fi-rr-paw" size={16} className="text-content-dark/40" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-accented font-bold text-sm text-content-dark">
              {request.pet.name}
            </span>
            <span className="font-primary text-xs text-content-dark/60">
              {request.pet.breed}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-xs font-primary py-2 border-y border-visit-gray/40">
        <div className="flex items-center justify-between text-content-dark/80">
          <span className="text-content-dark/60">Дата:</span>
          <span className="font-medium text-content-dark">
            {formatUkrainianDate(request.startsAt)}
          </span>
        </div>
        <div className="flex items-center justify-between text-content-dark/80">
          <span className="text-content-dark/60">Послуги:</span>
          <span className="font-medium text-content-dark text-right max-w-[13rem] truncate">
            {request.service.name}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-content-dark/60">Сума:</span>
          <span className="font-accented font-bold text-base text-content-dark">
            {formatPrice(request.price)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-primary text-xs font-semibold text-content-dark/70">
          Адреса салону
        </span>
        <div className="relative w-full h-24 rounded-xl overflow-hidden bg-visit-gray border border-visit-gray/80">
          <img
            src="/assets/images/pet-taxi-route-map.webp"
            alt="Карта салону"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-content-dark/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#EB6D48] text-white flex items-center justify-center shadow-md">
              <Icon name="fi-rr-paw" size={15} color="#FFFFFF" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 pt-1">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="master-select"
            className="font-primary text-xs font-semibold text-content-dark/70"
          >
            Призначити майстра
          </label>
          <div className="relative">
            <select
              id="master-select"
              aria-label="Призначити майстра"
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
              className="w-full bg-[#FFFBF6] border border-visit-gray/80 rounded-xl px-3.5 py-2.5 font-primary text-xs text-content-dark appearance-none pr-9 focus:outline-none focus:border-[#EB6D48] transition-colors"
            >
              {masters.length === 0 ? (
                <option value="">Немає доступних майстрів</option>
              ) : (
                masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                    {m.specialization ? ` (${m.specialization})` : ''}
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-content-dark/50">
              <Icon name="fi-rr-angle-small-down" size={16} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="visit-time-input"
            className="font-primary text-xs font-semibold text-content-dark/70"
          >
            Час візиту (запропонований)
          </label>
          <input
            id="visit-time-input"
            aria-label="Час візиту"
            type="datetime-local"
            value={proposedDateTime}
            onChange={(e) => setProposedDateTime(e.target.value)}
            className="w-full bg-[#FFFBF6] border border-visit-gray/80 rounded-xl px-3.5 py-2.5 font-primary text-xs text-content-dark focus:outline-none focus:border-[#EB6D48] transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleConfirm}
          className="w-full py-3.5 px-4 rounded-xl bg-[#EB6D48] hover:bg-[#EB6D48]/90 text-white font-accented font-bold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Збереження...' : 'Підтвердити та сповістити'}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleReject}
          className="w-full py-2 text-center font-primary font-semibold text-xs text-[#EB6D48] hover:text-[#EB6D48]/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          Відхилити заявку
        </button>
      </div>
    </aside>
  );
};

export default RequestDetailsInspector;
