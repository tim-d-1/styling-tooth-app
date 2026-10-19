import type { FC } from 'react';
import type { ProcedureOption } from '../booking_types';

export interface ProcedureDetailCardProps {
  procedure: ProcedureOption;
  onBook?: () => void;
  onAddMore?: () => void;
  className?: string;
}

export const ProcedureDetailCard: FC<ProcedureDetailCardProps> = ({
  procedure,
  onBook,
  onAddMore,
  className,
}) => {
  return (
    <article
      aria-label={`Деталі процедури: ${procedure.name}`}
      className={[
        'w-full max-w-[49.5rem] bg-white rounded-[10px] p-6 sm:pt-[3.75rem] sm:pb-[4.375rem] sm:px-12 shadow-[0_4px_20px_0_rgba(36,47,53,0.06)] flex flex-col justify-between',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center">
        <h2
          id="procedure-modal-title"
          className="text-2xl sm:text-[1.5rem] font-bold font-accented text-content-dark text-center m-0 leading-tight"
        >
          {procedure.name}
        </h2>

        <p className="text-lg sm:text-[1.375rem] font-normal font-primary text-content-dark text-center mt-3 sm:mt-3.5 mb-0">
          {procedure.duration}
        </p>

        <p className="text-base sm:text-[1.25rem] font-semibold font-accented text-content-dark text-center leading-relaxed mt-8 sm:mt-12 mb-0 max-w-[40rem]">
          {procedure.description}
        </p>
      </div>

      <div className="w-full text-right mt-6 sm:mt-8">
        <span className="text-lg sm:text-[1.375rem] font-semibold font-primary text-content-dark">
          {procedure.priceFormatted}
        </span>
      </div>

      {(onBook || onAddMore) && (
        <div className="w-full mt-8 sm:mt-14 flex flex-col items-center gap-6 sm:gap-[2.125rem]">
          {onBook && (
            <button
              type="button"
              onClick={onBook}
              className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-[#FFFBF6] font-accented font-semibold text-base flex items-center justify-center transition-colors cursor-pointer border-0 outline-none shadow-xs"
            >
              Записатись
            </button>
          )}

          {onAddMore && (
            <button
              type="button"
              onClick={onAddMore}
              className="text-base font-medium font-primary text-content-dark hover:text-terracotta transition-colors bg-transparent border-0 cursor-pointer outline-none text-center"
            >
              Додати ще процедуру
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default ProcedureDetailCard;
