import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { CareScheduleItem } from './pet_types';

export interface PetCareScheduleCardProps {
  scheduleItems?: CareScheduleItem[];
  onDetailsClick?: () => void;
}

export const PetCareScheduleCard: FC<PetCareScheduleCardProps> = ({
  scheduleItems = [],
  onDetailsClick,
}) => {
  return (
    <section
      data-testid="pet-care-schedule-card"
      aria-labelledby="care-schedule-heading"
      className="w-full bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h3
          id="care-schedule-heading"
          onClick={onDetailsClick}
          className="font-accented font-bold text-xl text-content-dark cursor-pointer hover:text-terracotta transition-colors"
        >
          Графік обробок
        </h3>
        <button
          type="button"
          onClick={onDetailsClick}
          aria-label="Деталі графіка обробок"
          className="text-soft-blue hover:text-soft-blue/80 transition-colors p-1 cursor-pointer outline-none"
        >
          <Icon name="fi-rr-angle-small-right" size={24} />
        </button>
      </div>

      {scheduleItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduleItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#f9fafb] rounded-2xl p-4 border border-black/5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-terracotta flex items-center justify-center">
                    <Icon name={item.iconName} size={18} />
                  </span>
                  <span className="font-primary font-semibold text-sm text-content-dark">
                    {item.title}
                  </span>
                </div>
                <span className="bg-interactive-lightgray text-content-dark/70 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                  {item.badgeText}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 text-xs text-content-dark/80 font-primary">
                {item.drugName && <span>Препарат: {item.drugName}</span>}
                {item.validUntilFormatted && (
                  <span>Термін: {item.validUntilFormatted}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          data-testid="empty-care-schedule"
          onClick={onDetailsClick}
          className="bg-[#f9fafb] rounded-2xl p-6 border border-black/5 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-soft-blue/20 text-terracotta flex items-center justify-center">
            <Icon name="fi-rr-calendar" size={18} />
          </div>
          <span className="font-accented font-semibold text-sm text-content-dark">
            Немає запланованих обробок
          </span>
          <span className="font-primary text-xs text-text-muted">
            Натисніть, щоб відкрити або налаштувати графік
          </span>
        </div>
      )}
    </section>
  );
};

export default PetCareScheduleCard;
