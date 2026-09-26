import { useState, useEffect, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { UpcomingVisitData } from './profile_types';

export interface ProfileUpcomingVisitCardProps {
  visit?: UpcomingVisitData | null;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBookClick?: () => void;
  onViewAllUpcoming?: () => void;
  isCancelling?: boolean;
}

export const ProfileUpcomingVisitCard: FC<ProfileUpcomingVisitCardProps> = ({
  visit,
  onReschedule,
  onCancel,
  onViewAllUpcoming,
  isCancelling = false,
}) => {
  const [petAvatarFailed, setPetAvatarFailed] = useState(false);

  useEffect(() => {
    setPetAvatarFailed(false);
  }, [visit?.petAvatarUrl]);

  return (
    <article className="w-full lg:flex-1 bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col justify-between gap-6 min-h-[15.625rem]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-accented font-bold text-xl md:text-2xl text-content-dark">
          Найближчий візит
        </h2>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onViewAllUpcoming}
            className="font-primary text-xs sm:text-sm font-semibold text-terracotta hover:text-terracotta-hover transition-colors inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 outline-none"
          >
            <span>Всі заплановані візити</span>
            <Icon name="fi-rr-arrow-right" size={12} />
          </button>

          {visit && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soft-blue text-white text-xs font-primary">
              <Icon name="fi-rr-clock" size={12} className="text-white" />
              <span>{visit.scheduledAtFormatted}</span>
            </div>
          )}
        </div>
      </div>

      {visit ? (
        <div className="w-full bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {visit.petAvatarUrl && !petAvatarFailed ? (
              <img
                src={visit.petAvatarUrl}
                alt={visit.petName}
                referrerPolicy="no-referrer"
                onError={() => setPetAvatarFailed(true)}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                data-testid="pet-default-avatar"
                className="w-12 h-12 rounded-full bg-soft-blue/20 flex items-center justify-center text-terracotta shrink-0"
              >
                <Icon name="fi-rr-paw" size={22} />
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span className="font-accented font-semibold text-lg sm:text-xl text-content-dark truncate">
                {visit.petName}
              </span>
              <span className="font-primary font-medium text-sm sm:text-base text-terracotta truncate">
                {visit.serviceTitle}
              </span>
              <span className="font-primary text-xs sm:text-sm text-content-dark/80 truncate">
                Майстер: {visit.masterName} • {visit.price.toLocaleString('uk-UA')} грн
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="flex-1 md:flex-initial h-11 px-5 rounded-xl border border-content-dark text-content-dark font-accented font-semibold text-sm sm:text-base hover:bg-gray-100 transition-colors cursor-pointer bg-transparent outline-none disabled:opacity-50"
            >
              {isCancelling ? 'Скасування...' : 'Скасувати'}
            </button>
            <button
              type="button"
              onClick={onReschedule}
              className="flex-1 md:flex-initial h-11 px-5 rounded-xl bg-terracotta hover:bg-terracotta-hover active:scale-[0.99] text-white font-accented font-semibold text-sm sm:text-base transition-all shadow-xs cursor-pointer border-0 outline-none"
            >
              Перенести
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 bg-surface-cream rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 border border-black/5">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-terracotta shadow-xs">
            <Icon name="fi-rr-calendar" size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-accented font-semibold text-base text-content-dark">
              Немає запланованих візитів
            </span>
            <span className="font-primary text-xs sm:text-sm text-text-muted">
              Оберіть зручний час для догляду за вашим улюбленцем
            </span>
          </div>
        </div>
      )}
    </article>
  );
};

export default ProfileUpcomingVisitCard;
