import { useState, type FC } from 'react';
import Button from '@/components/ui/Button';
import Switch from '@/components/ui/Switch';
import Icon from '@/components/ui/Icon';

export interface UpcomingVisitCardProps {
  id?: string;
  dayOfWeek?: string;
  dayNumber?: string;
  timeSlot?: string;
  masterName?: string;
  procedureName?: string;
  basePrice?: number;
  transferPrice?: number;
  initialTransferEnabled?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
  onBackClick?: () => void;
  isCancelling?: boolean;
  className?: string;
}

export const UpcomingVisitCard: FC<UpcomingVisitCardProps> = ({
  dayOfWeek = 'СЕР',
  dayNumber = '10',
  timeSlot = '16:00',
  masterName = 'Майстер салону',
  procedureName = 'Комплексний грумінг',
  basePrice = 1300,
  transferPrice = 100,
  initialTransferEnabled = false,
  onReschedule,
  onCancel,
  onBackClick,
  isCancelling = false,
  className,
}) => {
  const [transferEnabled, setTransferEnabled] = useState(initialTransferEnabled);

  const effectiveDayOfWeek = dayOfWeek?.trim() || 'СЕР';
  const effectiveDayNumber = dayNumber?.trim() || '10';
  const effectiveTimeSlot = timeSlot?.trim() || '16:00';
  const effectiveMasterName = masterName?.trim() || 'Майстер салону';
  const effectiveProcedureName = procedureName?.trim() || 'Комплексний грумінг';

  const currentProcedureCost = basePrice;
  const totalPrice = basePrice + (transferEnabled ? transferPrice : 0);

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

      <div className="bg-visit-gray rounded-[10px] p-4 sm:py-[1.0625rem] sm:pl-[1.9375rem] sm:pr-[1.625rem] flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        <div className="flex flex-col items-center justify-center shrink-0 w-16">
          <span className="text-xl font-normal text-content-dark uppercase font-primary text-center leading-none">
            {effectiveDayOfWeek}
          </span>
          <span className="text-5xl lg:text-6xl font-medium text-content-dark font-primary leading-none text-center my-1">
            {effectiveDayNumber}
          </span>
          <div className="h-px w-full max-w-[3.6875rem] bg-surface-cream my-1 mx-auto" />
          <span className="text-base font-medium text-content-dark font-primary text-center">
            {effectiveTimeSlot}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto flex-1 justify-center">
          <div className="w-full sm:w-[14rem] h-[8.6875rem] bg-surface-cream rounded-[10px] p-4 flex flex-col justify-between shadow-xs">
            <div>
              <span className="block text-sm font-medium text-content-dark font-primary">
                Майстер:
              </span>
              <span className="block text-sm font-normal text-content-dark font-primary mt-1">
                {effectiveMasterName}
              </span>
            </div>
            <div>
              <span className="block text-sm font-medium text-content-dark font-primary">
                Процедура:
              </span>
              <span className="block text-sm font-normal text-content-dark font-primary mt-1">
                {effectiveProcedureName}
              </span>
            </div>
          </div>

          <div className="w-full sm:w-[20.4375rem] h-[8.6875rem] bg-surface-cream rounded-[10px] p-4 flex flex-col justify-between shadow-xs">
            <div>
              <span className="block text-sm font-medium text-content-dark font-primary">
                Вартість обраних процедур:
              </span>
              <span className="block text-sm font-normal text-content-dark font-primary mt-1">
                {transferEnabled ? `${totalPrice} ₴` : `${currentProcedureCost} ₴`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="block text-sm font-medium text-content-dark font-primary">
                  Трансфер улюбленця:
                </span>
                <span className="block text-sm font-normal text-content-dark font-primary mt-1">
                  {transferPrice} ₴
                </span>
              </div>
              <Switch
                checked={transferEnabled}
                onChange={(checked: boolean) => setTransferEnabled(checked)}
                id="pet-transfer-switch"
                ariaLabel="Увімкнути або вимкнути трансфер улюбленця"
              />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[11.4375rem] flex flex-col gap-4.5 justify-center shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={onReschedule}
            aria-label="Перенести запланований візит"
            className="w-full h-11 bg-terracotta hover:bg-terracotta-hover text-surface-cream font-accented font-semibold text-base rounded-xl transition-colors shadow-xs"
          >
            Перенести
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={isCancelling}
            aria-label="Скасувати запланований візит"
            className="w-full h-11 border border-content-dark hover:bg-black/5 text-content-dark font-accented font-semibold text-base rounded-xl transition-colors disabled:opacity-50"
          >
            {isCancelling ? 'Скасування...' : 'Скасувати'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default UpcomingVisitCard;
