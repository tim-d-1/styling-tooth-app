import type { FC } from 'react';
import Icon from './ui/Icon';
import Button from './ui/Button';
import UpcomingVisitCard, { type UpcomingVisitCardProps } from './UpcomingVisitCard';

export type VisitData = Omit<UpcomingVisitCardProps, 'onReschedule' | 'onCancel'>;

export interface VisitSectionProps {
  isLoggedIn?: boolean;
  visit?: VisitData | null;
  onLoginClick?: () => void;
  onBookClick?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
}

export const VisitSection: FC<VisitSectionProps> = ({
  isLoggedIn = false,
  visit = null,
  onLoginClick,
  onBookClick,
  onReschedule,
  onCancel,
}) => {
  if (!isLoggedIn) {
    return (
      <section className="max-w-[1200px] mx-auto my-6 px-8 mb-10">
        <h2 className="text-2xl font-semibold font-accented mb-4 text-content-dark">
          Запланований візит
        </h2>
        <div className="bg-visit-gray rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-terracotta shrink-0 shadow-xs">
              <Icon name="fi-rr-paw" size={24} color="var(--color-interactive-primary)" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-accented text-content-dark m-0">
                Увійдіть або зареєструйтесь
              </h3>
              <p className="text-sm text-gray-600 font-primary mt-1 mb-0 max-w-lg">
                Авторизуйтесь, щоб переглядати заплановані візити, історію послуг та керувати записами улюбленця.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onLoginClick}
            className="bg-terracotta rounded-xl shadow-xs hover:bg-[#d8552d] transition-colors whitespace-nowrap px-6 shrink-0"
          >
            Log In
          </Button>
        </div>
      </section>
    );
  }

  if (!visit) {
    return (
      <section className="max-w-[1200px] mx-auto my-6 px-8 mb-10">
        <h2 className="text-2xl font-semibold font-accented mb-4 text-content-dark">
          Запланований візит
        </h2>
        <div className="bg-visit-gray rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xs text-terracotta">
            <Icon name="fi-rr-calendar" size={26} color="var(--color-interactive-primary)" />
          </div>
          <div className="max-w-md">
            <h3 className="text-xl font-bold font-accented text-content-dark m-0">
              No upcoming visits
            </h3>
            <p className="text-sm text-gray-500 font-primary mt-1.5 mb-0">
              У вас наразі немає запланованих візитів. Оберіть зручний час та процедуру для вашого улюбленця.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onBookClick}
            className="bg-terracotta rounded-xl shadow-xs hover:bg-[#d8552d] transition-colors px-6 mt-2"
          >
            Book Appointment
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
    />
  );
};

export default VisitSection;
