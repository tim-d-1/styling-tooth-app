import type { FC } from 'react';
import BookingProgressBar from '../components/BookingProgressBar';
import { PROCEDURES_CATALOG, type ProcedureOption } from '../booking_types';

export interface BookingProcedureStepProps {
  procedures?: ProcedureOption[];
  selectedProcedureId?: string;
  onSelectProcedure: (procedure: ProcedureOption) => void;
  onNext: () => void;
}

export const BookingProcedureStep: FC<BookingProcedureStepProps> = ({
  procedures = PROCEDURES_CATALOG,
  selectedProcedureId,
  onSelectProcedure,
  onNext,
}) => {
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug mb-8 sm:mb-10">
        Обери процедуру
      </h1>

      <div
        role="radiogroup"
        aria-label="Оберіть процедуру"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-x-6 sm:gap-y-4"
      >
        {procedures.map((proc) => {
          const isSelected = proc.id === selectedProcedureId;
          return (
            <button
              key={proc.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectProcedure(proc)}
              className={[
                'h-12 w-full rounded-[10px] text-base font-accented transition-colors flex items-center justify-center cursor-pointer outline-none',
                isSelected
                  ? 'bg-terracotta border border-terracotta text-white font-semibold shadow-xs'
                  : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta hover:text-terracotta',
              ].join(' ')}
            >
              {proc.name}
            </button>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedProcedureId}
          className={[
            'w-full h-12 rounded-xl text-base font-accented font-semibold transition-colors flex items-center justify-center border-0 outline-none',
            selectedProcedureId
              ? 'bg-terracotta hover:bg-terracotta-hover text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Далі
        </button>
      </div>

      <BookingProgressBar currentStep={2} />
    </div>
  );
};

export default BookingProcedureStep;
