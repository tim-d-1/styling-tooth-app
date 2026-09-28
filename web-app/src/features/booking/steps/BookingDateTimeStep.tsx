import { useState, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import BookingProgressBar from '../components/BookingProgressBar';
import { TIME_SLOTS, type WeekDayOption } from '../booking_types';

export interface BookingDateTimeStepProps {
  selectedDate?: string;
  selectedTimeSlot?: string;
  onSelectDateTime: (date: string, timeSlot: string, formattedDate: string) => void;
  onNext: () => void;
}

const DEFAULT_DAYS: WeekDayOption[] = [
  { dayName: 'Пн', dayNumber: 9, fullDate: '2026-08-09' },
  { dayName: 'Вт', dayNumber: 10, fullDate: '2026-08-10' },
  { dayName: 'Ср', dayNumber: 11, fullDate: '2026-08-11' },
  { dayName: 'Чт', dayNumber: 12, fullDate: '2026-08-12' },
  { dayName: 'Пт', dayNumber: 13, fullDate: '2026-08-13' },
  { dayName: 'Сб', dayNumber: 14, fullDate: '2026-08-14' },
  { dayName: 'Нд', dayNumber: 15, fullDate: '2026-08-15' },
];

export const BookingDateTimeStep: FC<BookingDateTimeStepProps> = ({
  selectedDate,
  selectedTimeSlot,
  onSelectDateTime,
  onNext,
}) => {
  const [currentDate, setCurrentDate] = useState<string>(
    selectedDate || '2026-08-11'
  );
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string>(
    selectedTimeSlot || '16:00'
  );

  const handleSelectDay = (day: WeekDayOption) => {
    setCurrentDate(day.fullDate);
    const dayFormatted = `${day.dayNumber < 10 ? '0' : ''}${day.dayNumber}.08.2026`;
    onSelectDateTime(day.fullDate, currentTimeSlot, dayFormatted);
  };

  const handleSelectSlot = (slot: string) => {
    setCurrentTimeSlot(slot);
    const dayObj = DEFAULT_DAYS.find((d) => d.fullDate === currentDate) || DEFAULT_DAYS[2];
    const dayFormatted = `${dayObj.dayNumber < 10 ? '0' : ''}${dayObj.dayNumber}.08.2026`;
    onSelectDateTime(currentDate, slot, dayFormatted);
  };

  const handleContinue = () => {
    const dayObj = DEFAULT_DAYS.find((d) => d.fullDate === currentDate) || DEFAULT_DAYS[2];
    const dayFormatted = `${dayObj.dayNumber < 10 ? '0' : ''}${dayObj.dayNumber}.08.2026`;
    onSelectDateTime(currentDate, currentTimeSlot, dayFormatted);
    onNext();
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug mb-8">
        Коли вам зручно?
      </h1>

      <div className="bg-visit-gray rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            aria-label="Попередній тиждень"
            className="w-10 h-10 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors cursor-pointer bg-white outline-none"
          >
            <Icon name="fi-rr-angle-double-left" size={14} />
          </button>

          <h2 className="text-xl font-bold font-accented text-content-dark m-0">
            Серпень
          </h2>

          <button
            type="button"
            aria-label="Наступний тиждень"
            className="w-10 h-10 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors cursor-pointer bg-white outline-none"
          >
            <Icon name="fi-rr-angle-double-right" size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-3 max-w-[28rem] mx-auto">
          {DEFAULT_DAYS.map((day) => {
            const isSelected = day.fullDate === currentDate;
            return (
              <button
                key={day.fullDate}
                type="button"
                onClick={() => handleSelectDay(day)}
                aria-pressed={isSelected}
                className={[
                  'flex flex-col items-center justify-center w-10 sm:w-12 h-14 sm:h-16 rounded-xl transition-all cursor-pointer border-0 outline-none font-accented',
                  isSelected
                    ? 'bg-soft-blue text-white shadow-xs'
                    : 'bg-transparent text-content-dark hover:bg-white/60',
                ].join(' ')}
              >
                <span className="text-xs sm:text-sm font-medium">
                  {day.dayName}
                </span>
                <span className="text-sm sm:text-base font-bold mt-0.5">
                  {day.dayNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Оберіть час"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-x-6 sm:gap-y-4 mt-8"
      >
        {TIME_SLOTS.map((slot) => {
          const isSelected = slot === currentTimeSlot;
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelectSlot(slot)}
              className={[
                'h-12 w-full rounded-[10px] text-base font-accented transition-colors flex items-center justify-center cursor-pointer outline-none',
                isSelected
                  ? 'bg-soft-blue border border-soft-blue text-white font-semibold shadow-xs'
                  : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta hover:text-terracotta',
              ].join(' ')}
            >
              {slot}
            </button>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!currentDate || !currentTimeSlot}
          className={[
            'w-full h-12 rounded-xl text-base font-accented font-semibold transition-colors flex items-center justify-center border-0 outline-none',
            currentDate && currentTimeSlot
              ? 'bg-terracotta hover:bg-terracotta-hover text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Далі
        </button>
      </div>

      <BookingProgressBar currentStep={4} />
    </div>
  );
};

export default BookingDateTimeStep;
