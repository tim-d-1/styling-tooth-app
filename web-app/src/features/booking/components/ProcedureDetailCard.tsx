import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { ProcedureOption } from '../booking_types';

export interface ProcedureDetailCardProps {
  procedure: ProcedureOption;
  className?: string;
}

export const ProcedureDetailCard: FC<ProcedureDetailCardProps> = ({
  procedure,
  className,
}) => {
  return (
    <section
      aria-label={`Деталі процедури: ${procedure.name}`}
      className={[
        'p-6 sm:p-7 bg-[#FCFAF7] border border-[#242F35]/15 rounded-2xl flex flex-col gap-4 shadow-xs transition-all duration-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <h2 className="text-xl sm:text-2xl font-bold font-accented text-content-dark tracking-tight">
          {procedure.name}
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-visit-gray text-content-dark/80 text-xs sm:text-sm font-medium w-fit">
          <Icon name="fi-rr-clock" size={14} className="text-terracotta" />
          <span>{procedure.duration}</span>
        </div>
      </div>

      <p className="text-sm sm:text-base font-primary text-content-dark/80 leading-relaxed">
        {procedure.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-[#242F35]/10 mt-1">
        <span className="text-xs sm:text-sm font-primary text-content-dark/60 font-medium">
          Вартість послуги
        </span>
        <span className="text-lg sm:text-xl font-bold font-accented text-terracotta">
          {procedure.priceFormatted}
        </span>
      </div>
    </section>
  );
};

export default ProcedureDetailCard;
