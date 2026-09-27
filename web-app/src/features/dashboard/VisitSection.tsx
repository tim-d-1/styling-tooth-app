import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import UpcomingVisitCard, { type UpcomingVisitCardProps } from './UpcomingVisitCard';

export type VisitData = Omit<UpcomingVisitCardProps, 'onReschedule' | 'onCancel'>;

export interface VisitSectionProps {
  visit?: VisitData | null;
  isLoading?: boolean;
  onBookClick?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBackClick?: () => void;
  isCancelling?: boolean;
  isLoggedIn?: boolean;
  className?: string;
}

export const VisitSectionSkeleton: FC<{ onBackClick?: () => void; className?: string }> = ({
  onBackClick,
  className,
}) => {
  return (
    <section
      role="status"
      aria-label="Завантаження запланованого візиту"
      className={['max-w-[75rem] mx-auto my-6 px-6 sm:px-8 mb-10', className].filter(Boolean).join(' ')}
    >
      {onBackClick && (
        <button
          type="button"
          onClick={onBackClick}
          aria-label="Назад"
          className="mb-4 inline-flex items-center justify-center p-1 text-content-dark hover:opacity-80 transition-opacity cursor-pointer border-0 bg-transparent"
        >
          <Icon name="fi-rr-arrow-left" size={20} color="var(--color-content-primary)" />
        </button>
      )}
      <h2 className="text-2xl font-bold font-accented mb-4 text-content-dark">
        Запланований візит
      </h2>

      <div className="bg-visit-gray rounded-[10px] p-4 sm:py-[1.0625rem] sm:pl-[1.9375rem] sm:pr-[1.625rem] flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 animate-pulse">
        <div className="flex flex-col items-center justify-center shrink-0 w-16 gap-2">
          <div className="w-10 h-5 bg-black/10 rounded" />
          <div className="w-14 h-12 bg-black/10 rounded" />
          <div className="w-10 h-4 bg-black/10 rounded" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto flex-1 justify-center">
          <div className="w-full sm:w-[14rem] h-[8.6875rem] bg-surface-cream rounded-[10px] p-4 flex flex-col justify-between shadow-xs">
            <div className="flex flex-col gap-2">
              <div className="w-16 h-3 bg-black/10 rounded" />
              <div className="w-28 h-4 bg-black/10 rounded" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-16 h-3 bg-black/10 rounded" />
              <div className="w-32 h-4 bg-black/10 rounded" />
            </div>
          </div>

          <div className="w-full sm:w-[20.4375rem] h-[8.6875rem] bg-surface-cream rounded-[10px] p-4 flex flex-col justify-between shadow-xs">
            <div className="flex flex-col gap-2">
              <div className="w-36 h-3 bg-black/10 rounded" />
              <div className="w-20 h-4 bg-black/10 rounded" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-2">
                <div className="w-32 h-3 bg-black/10 rounded" />
                <div className="w-16 h-4 bg-black/10 rounded" />
              </div>
              <div className="w-13 h-7 bg-black/10 rounded-full" />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[11.4375rem] flex flex-col gap-4.5 justify-center shrink-0">
          <div className="w-full h-11 bg-black/10 rounded-xl" />
          <div className="w-full h-11 bg-black/10 rounded-xl" />
        </div>
      </div>
    </section>
  );
};

export const VisitSection: FC<VisitSectionProps> = ({
  visit = null,
  isLoading = false,
  onBookClick,
  onReschedule,
  onCancel,
  onBackClick,
  isCancelling = false,
  className,
}) => {
  if (isLoading) {
    return <VisitSectionSkeleton onBackClick={onBackClick} className={className} />;
  }

  if (!visit) {
    return (
      <section className={['max-w-[75rem] mx-auto my-6 px-6 sm:px-8 mb-10', className].filter(Boolean).join(' ')}>
        {onBackClick && (
          <button
            type="button"
            onClick={onBackClick}
            aria-label="Назад"
            className="mb-4 inline-flex items-center justify-center p-1 text-content-dark hover:opacity-80 transition-opacity cursor-pointer border-0 bg-transparent"
          >
            <Icon name="fi-rr-arrow-left" size={20} color="var(--color-content-primary)" />
          </button>
        )}
        <h2 className="text-2xl font-bold font-accented mb-4 text-content-dark">
          Запланований візит
        </h2>
        <div className="bg-visit-gray rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4 shadow-xs min-h-[14rem] h-auto">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xs text-terracotta">
            <Icon name="fi-rr-calendar" size={26} color="var(--color-interactive-primary)" />
          </div>
          <div className="max-w-md">
            <h3 className="text-xl font-bold font-accented text-content-dark m-0">
              Немає активних записів
            </h3>
            <p className="text-sm text-gray-500 font-primary mt-1.5 mb-0">
              У вас наразі немає запланованих візитів. Оберіть зручний час та процедуру для вашого улюбленця.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onBookClick}
            aria-label="Запланувати візит"
            className="bg-terracotta rounded-xl shadow-xs hover:bg-terracotta-hover transition-colors px-6 mt-2"
          >
            Запланувати візит
          </Button>
        </div>
      </section>
    );
  }

  return (
    <UpcomingVisitCard
      id={visit.id}
      dayOfWeek={visit.dayOfWeek}
      dayNumber={visit.dayNumber}
      timeSlot={visit.timeSlot}
      masterName={visit.masterName}
      procedureName={visit.procedureName}
      basePrice={visit.basePrice}
      transferPrice={visit.transferPrice}
      initialTransferEnabled={visit.initialTransferEnabled}
      onReschedule={onReschedule}
      onCancel={onCancel}
      onBackClick={onBackClick}
      isCancelling={isCancelling}
      className={className}
    />
  );
};

export default VisitSection;
