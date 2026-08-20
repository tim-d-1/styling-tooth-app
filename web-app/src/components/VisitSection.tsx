import type { FC } from 'react';
import Icon from './ui/Icon';
import Button from './ui/Button';
import UpcomingVisitCard, { type UpcomingVisitCardProps } from './UpcomingVisitCard';

export type VisitData = Omit<UpcomingVisitCardProps, 'onReschedule' | 'onCancel'>;

export interface VisitSectionProps {
  visit?: VisitData | null;
  onBookClick?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  isLoggedIn?: boolean;
  className?: string;
}

export const VisitSection: FC<VisitSectionProps> = ({
  visit = null,
  onBookClick,
  onReschedule,
  onCancel,
  className,
}) => {
  if (!visit) {
    return (
      <section className={['max-w-[1200px] mx-auto my-6 px-6 sm:px-8 mb-10', className].filter(Boolean).join(' ')}>
        <h2 className="text-2xl font-semibold font-accented mb-4 text-content-dark">
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
      className={className}
    />
  );
};

export default VisitSection;
