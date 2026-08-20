import { useState, type FC } from 'react';
import Button from './ui/Button';
import Switch from './ui/Switch';

export interface UpcomingVisitCardProps {
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
  className?: string;
}

export const UpcomingVisitCard: FC<UpcomingVisitCardProps> = ({
  dayOfWeek = 'СЕР',
  dayNumber = '10',
  timeSlot = '16:00',
  masterName = 'Марія Шевченко',
  procedureName = 'Комплексний грумінг',
  basePrice = 1300,
  transferPrice = 100,
  initialTransferEnabled = false,
  onReschedule,
  onCancel,
  className,
}) => {
  const [transferEnabled, setTransferEnabled] = useState(initialTransferEnabled);

  const effectiveDayOfWeek = dayOfWeek?.trim() || 'СЕР';
  const effectiveDayNumber = dayNumber?.trim() || '10';
  const effectiveTimeSlot = timeSlot?.trim() || '16:00';
  const effectiveMasterName = masterName?.trim() || 'Марія Шевченко';
  const effectiveProcedureName = procedureName?.trim() || 'Комплексний грумінг';

  const currentProcedureCost = basePrice;
  const totalPrice = basePrice + (transferEnabled ? transferPrice : 0);

  return (
    <section className={['max-w-[1200px] mx-auto my-6 px-6 sm:px-8 mb-10', className].filter(Boolean).join(' ')}>
      <h2 className="text-2xl font-semibold font-accented mb-4 text-content-dark">
        Запланований візит
      </h2>

      <div className="bg-visit-gray rounded-3xl p-6 flex flex-wrap items-stretch justify-between gap-5 min-h-[6rem] h-auto">
        <div className="bg-white rounded-2xl p-4 md:px-6 flex items-center gap-6 flex-1 min-w-[280px] shadow-xs min-h-[5rem] h-auto">
          <div className="flex flex-col items-center justify-center border-r border-visit-gray pr-5 min-w-[70px]">
            <span className="text-xs font-semibold text-content-dark uppercase font-accented">
              {effectiveDayOfWeek}
            </span>
            <span className="text-4xl font-bold leading-none my-1 text-content-dark">
              {effectiveDayNumber}
            </span>
            <span className="text-xs font-medium text-content-dark">
              {effectiveTimeSlot}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 justify-center">
            <div>
              <span className="text-xs text-gray-500 block leading-tight">Майстер:</span>
              <strong className="text-sm font-semibold text-content-dark leading-tight">
                {effectiveMasterName}
              </strong>
            </div>
            <div>
              <span className="text-xs text-gray-500 block leading-tight">Процедура:</span>
              <strong className="text-sm font-semibold text-content-dark leading-tight">
                {effectiveProcedureName}
              </strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl py-3 px-4 md:px-6 flex flex-col justify-between gap-3 flex-1 min-w-[260px] shadow-xs min-h-[5rem] h-auto">
          <div className="flex items-center justify-between text-sm text-content-dark">
            <span>Вартість обраних процедур:</span>
            <strong className="text-base font-semibold">
              {transferEnabled ? `${totalPrice} ₴` : `${currentProcedureCost} ₴`}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm text-content-dark">
            <div className="flex items-center gap-2">
              <span>Трансфер улюбленця:</span>
              <strong className="text-base font-semibold">{transferPrice} ₴</strong>
            </div>
            <Switch
              checked={transferEnabled}
              onChange={(checked) => setTransferEnabled(checked)}
              id="pet-transfer-switch"
              ariaLabel="Увімкнути або вимкнути трансфер улюбленця"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2.5 min-w-[140px] w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            onClick={onReschedule}
            aria-label="Перенести запланований візит"
            className="w-full bg-terracotta rounded-xl shadow-xs hover:bg-terracotta-hover transition-colors"
          >
            Перенести
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            aria-label="Скасувати запланований візит"
            className="w-full rounded-xl border-content-dark hover:bg-gray-100 transition-colors"
          >
            Скасувати
          </Button>
        </div>
      </div>
    </section>
  );
};

export default UpcomingVisitCard;
