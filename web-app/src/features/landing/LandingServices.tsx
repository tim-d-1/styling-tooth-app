import type { FC } from 'react';
import AppIcon from '@/components/icons';
import { LANDING_SERVICES } from './landing_types';

export interface LandingServicesProps {
  onQuickBookClick?: () => void;
}

export const LandingServices: FC<LandingServicesProps> = ({
  onQuickBookClick,
}) => {
  return (
    <section id="services" className="w-full py-20 bg-landing-page">
      <div className="max-w-[75rem] mx-auto px-6 flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-2xl flex flex-col gap-5">
            <h2 className="font-accented font-bold text-3xl md:text-4xl leading-tight text-content-dark">
              Наші послуги
            </h2>
            <p className="font-accented text-base leading-relaxed text-content-dark max-w-xl">
              У «Стильному Зубці» ми подбали про все необхідне для краси,
              здоров’я та комфорту вашого улюбленця
            </p>
          </div>

          <button
            type="button"
            onClick={onQuickBookClick}
            className="w-full lg:w-[30.5rem] h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-surface-cream font-accented font-semibold text-base flex items-center justify-center transition-colors shadow-sm cursor-pointer shrink-0"
          >
            Швидкий запис
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {LANDING_SERVICES.map((service) => (
            <div
              key={service.id}
              className="bg-surface-cream rounded-xl shadow-card px-6 pt-7 pb-9 flex flex-col items-center text-center justify-between transition-transform hover:-translate-y-0.5"
            >
              <div className="w-full flex flex-col items-center">
                <AppIcon
                  name={service.icon}
                  className="w-6 h-6 text-terracotta"
                />
                <h3 className="mt-5 font-accented font-bold text-xl text-terracotta leading-snug">
                  {service.title}
                </h3>
              </div>

              <div className="w-full h-px bg-visit-gray my-5" />

              <p className="font-accented text-base text-content-dark leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingServices;
