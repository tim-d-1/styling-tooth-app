import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { BookingStage, BookingState } from '../booking_types';

export interface BookingConfirmationStepProps {
  bookingState: BookingState;
  onEditStage: (stage: BookingStage) => void;
  onConfirm: () => void;
}

export const BookingConfirmationStep: FC<BookingConfirmationStepProps> = ({
  bookingState,
  onEditStage,
  onConfirm,
}) => {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString('uk-UA')} ₴`;
  };

  const details = [
    {
      id: 'pet',
      icon: 'fi-rr-paw',
      label: 'Улюбленець',
      value: bookingState.petName || 'Не обрано',
      stage: 'pet' as BookingStage,
    },
    {
      id: 'procedure',
      icon: 'fi-rr-scissors',
      label: 'Процедура',
      value: bookingState.procedureName || 'Не обрано',
      stage: 'procedure' as BookingStage,
    },
    {
      id: 'master',
      icon: 'fi-rr-user',
      label: 'Майстер',
      value: bookingState.masterName || 'Будь-який вільний майстер',
      stage: 'master' as BookingStage,
    },
    {
      id: 'date',
      icon: 'fi-rr-calendar',
      label: 'Дата',
      value: bookingState.dateFormatted || '11.08.2026',
      stage: 'datetime' as BookingStage,
    },
    {
      id: 'time',
      icon: 'fi-rr-alarm-clock',
      label: 'Час',
      value: bookingState.timeSlot || '16:00',
      stage: 'datetime' as BookingStage,
    },
    {
      id: 'price',
      icon: 'fi-rr-usd-circle',
      label: 'Вартість обраних процедур',
      value: formatPrice(bookingState.procedurePrice || 1300),
      stage: 'procedure' as BookingStage,
    },
    {
      id: 'transfer',
      icon: 'fi-rr-home',
      label: 'Трансфер улюбленця',
      value: bookingState.transferEnabled
        ? formatPrice(bookingState.transferPrice || 100)
        : 'Не замовлено',
      stage: 'remarks' as BookingStage,
    },
  ];

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug mb-8 sm:mb-10">
        Деталі запису
      </h1>

      <div className="flex flex-col gap-3.5">
        {details.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3.5 sm:px-6 sm:py-4 rounded-2xl bg-visit-gray/80 transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
                <Icon name={item.icon} size={18} color="#EC643A" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-accented font-medium text-terracotta leading-tight">
                  {item.label}
                </div>
                <div className="text-sm sm:text-base font-accented font-bold text-content-dark truncate leading-snug mt-0.5">
                  {item.value}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEditStage(item.stage)}
              aria-label={`Редагувати: ${item.label}`}
              className="p-2 text-content-dark/60 hover:text-terracotta transition-colors cursor-pointer border-0 bg-transparent outline-none shrink-0"
            >
              <Icon name="fi-rr-pencil" size={16} color="currentColor" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 sm:mt-12">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-base font-accented font-semibold transition-colors flex items-center justify-center cursor-pointer border-0 outline-none shadow-xs"
        >
          Підтвердити запис
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmationStep;
