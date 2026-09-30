import { useState, useEffect, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import BookingProgressBar from '../components/BookingProgressBar';
import { TIME_SLOTS, type WeekDayOption } from '../booking_types';
import { supabase } from '@/lib/supabase';

export interface BookingDateTimeStepProps {
  selectedDate?: string;
  selectedTimeSlot?: string;
  masterId?: string;
  procedureId?: string;
  onSelectDateTime: (date: string, timeSlot: string, formattedDate: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

const UK_MONTH_NAMES = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

const UK_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function getWeekDays(startFullDate: string): WeekDayOption[] {
  const start = new Date(startFullDate + 'T00:00:00Z');
  const days: WeekDayOption[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const dayNumber = d.getUTCDate();
    const dayName = UK_DAY_NAMES[i];
    const fullDate = d.toISOString().split('T')[0];
    days.push({ dayName, dayNumber, fullDate });
  }
  return days;
}

export const BookingDateTimeStep: FC<BookingDateTimeStepProps> = ({
  selectedDate,
  selectedTimeSlot,
  masterId,
  procedureId,
  onSelectDateTime,
  onNext,
}) => {
  const [weekStartDate, setWeekStartDate] = useState<string>('2026-08-09');
  const [currentDate, setCurrentDate] = useState<string>(
    selectedDate || '2026-08-11'
  );
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string>(
    selectedTimeSlot || '16:00'
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);

  const weekDays = getWeekDays(weekStartDate);
  const midDay = weekDays[3] || weekDays[0];
  const monthName =
    UK_MONTH_NAMES[new Date(midDay.fullDate + 'T00:00:00Z').getUTCMonth()];

  useEffect(() => {
    let isMounted = true;
    async function loadSlots() {
      const isUUID = (v?: string) =>
        Boolean(
          v &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              v
            )
        );

      if (procedureId && isUUID(procedureId)) {
        try {
          if (masterId && isUUID(masterId)) {
            const { data, error } = await supabase.rpc('get_available_slots', {
              p_master_id: masterId,
              p_service_id: procedureId,
              p_date: currentDate,
            });
            if (isMounted && !error && Array.isArray(data) && data.length > 0) {
              const formatted = data.map((row: { slot_start: string }) => {
                const d = new Date(row.slot_start);
                return d.toLocaleTimeString('uk-UA', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Kyiv',
                });
              });
              setAvailableSlots(formatted);
              if (!formatted.includes(currentTimeSlot)) {
                setCurrentTimeSlot(formatted[0] || '');
              }
              return;
            }
          } else if (masterId === 'any' || !masterId) {
            const { data, error } = await supabase.rpc(
              'get_available_slots_all_masters',
              {
                p_service_id: procedureId,
                p_date: currentDate,
              }
            );
            if (isMounted && !error && Array.isArray(data) && data.length > 0) {
              const uniqueSlots = Array.from(
                new Set(
                  data.map((row: { slot_start: string }) => {
                    const d = new Date(row.slot_start);
                    return d.toLocaleTimeString('uk-UA', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Kyiv',
                    });
                  })
                )
              ).sort();
              setAvailableSlots(uniqueSlots);
              if (!uniqueSlots.includes(currentTimeSlot)) {
                setCurrentTimeSlot(uniqueSlots[0] || '');
              }
              return;
            }
          }
        } catch {
          // Fallback to TIME_SLOTS
        }
      }

      if (isMounted) {
        setAvailableSlots(TIME_SLOTS);
      }
    }

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [currentDate, masterId, procedureId]);

  const handlePrevWeek = () => {
    const prevDate = new Date(
      new Date(weekStartDate + 'T00:00:00Z').getTime() - 7 * 86400000
    )
      .toISOString()
      .split('T')[0];
    setWeekStartDate(prevDate);
  };

  const handleNextWeek = () => {
    const nextDate = new Date(
      new Date(weekStartDate + 'T00:00:00Z').getTime() + 7 * 86400000
    )
      .toISOString()
      .split('T')[0];
    setWeekStartDate(nextDate);
  };

  const formatDayString = (dayFullDate: string) => {
    const d = new Date(dayFullDate + 'T00:00:00Z');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleSelectDay = (day: WeekDayOption) => {
    setCurrentDate(day.fullDate);
    onSelectDateTime(
      day.fullDate,
      currentTimeSlot,
      formatDayString(day.fullDate)
    );
  };

  const handleSelectSlot = (slot: string) => {
    setCurrentTimeSlot(slot);
    onSelectDateTime(currentDate, slot, formatDayString(currentDate));
  };

  const handleContinue = () => {
    onSelectDateTime(
      currentDate,
      currentTimeSlot,
      formatDayString(currentDate)
    );
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
            onClick={handlePrevWeek}
            aria-label="Попередній тиждень"
            className="w-10 h-10 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors cursor-pointer bg-white outline-none"
          >
            <Icon name="fi-rr-angle-double-left" size={14} />
          </button>

          <h2 className="text-xl font-bold font-accented text-content-dark m-0">
            {monthName}
          </h2>

          <button
            type="button"
            onClick={handleNextWeek}
            aria-label="Наступний тиждень"
            className="w-10 h-10 rounded-full border border-[#242F35] flex items-center justify-center text-content-dark hover:border-terracotta hover:text-terracotta transition-colors cursor-pointer bg-white outline-none"
          >
            <Icon name="fi-rr-angle-double-right" size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-1.5 sm:gap-3 max-w-[28rem] mx-auto">
          {weekDays.map((day) => {
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
        {availableSlots.map((slot) => {
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
