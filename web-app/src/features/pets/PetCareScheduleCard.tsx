import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { CareScheduleItem } from './pet_types';

export interface PetCareScheduleCardProps {
  scheduleItems?: CareScheduleItem[];
  onDetailsClick?: () => void;
}

const defaultScheduleItems: CareScheduleItem[] = [
  {
    id: 'flea-tick',
    title: 'Від кліщів та бліх',
    badgeText: 'Через 14 днів',
    drugName: 'Bravecto',
    validUntilFormatted: 'до 15 серпня 2026',
    iconName: 'fi-rr-shield-check',
  },
  {
    id: 'vaccine',
    title: 'Вакцинація',
    badgeText: 'В нормі',
    drugName: 'Комплексна + Сказ',
    validUntilFormatted: 'до 15 жовтня 2026',
    iconName: 'fi-rr-syringe',
  },
];

export const PetCareScheduleCard: FC<PetCareScheduleCardProps> = ({
  scheduleItems = defaultScheduleItems,
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
          className="font-accented font-bold text-xl text-content-dark"
        >
          Графік обробок
        </h3>
        <button
          type="button"
          onClick={onDetailsClick}
          aria-label="Деталі графіка обробок"
          className="text-soft-blue hover:text-soft-blue/80 transition-colors p-1"
        >
          <Icon name="fi-rr-angle-small-right" size={24} />
        </button>
      </div>

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
    </section>
  );
};

export default PetCareScheduleCard;
