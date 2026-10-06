import { useState, type FC } from 'react';
import BookingProgressBar from '../components/BookingProgressBar';
import ProcedureDetailCard from '../components/ProcedureDetailCard';
import Icon from '@/components/ui/Icon';
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
  const selectedProcedure = procedures.find((p) => p.id === selectedProcedureId);
  const [modalProcedure, setModalProcedure] = useState<ProcedureOption | null>(null);

  const handleProcedureClick = (proc: ProcedureOption) => {
    onSelectProcedure(proc);
    setModalProcedure(proc);
  };

  const handleBookFromModal = () => {
    if (modalProcedure) {
      onSelectProcedure(modalProcedure);
      setModalProcedure(null);
      onNext();
    }
  };

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
              onClick={() => handleProcedureClick(proc)}
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

      {selectedProcedure && !modalProcedure && (
        <div className="mt-6">
          <ProcedureDetailCard procedure={selectedProcedure} />
        </div>
      )}

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

      {modalProcedure && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="procedure-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setModalProcedure(null)}
        >
          <div
            className="w-full max-w-[24.5rem] bg-[#FFFBF6] rounded-2xl p-6 shadow-xl relative border border-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-1.5 bg-[#ECEEF1] rounded-full" />
            </div>

            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2
                  id="procedure-modal-title"
                  className="text-xl font-bold font-accented text-content-dark"
                >
                  {modalProcedure.name}
                </h2>
                <div className="text-sm font-primary text-content-dark/80 mt-1">
                  {modalProcedure.duration}
                </div>
              </div>
              <button
                type="button"
                aria-label="Закрити"
                onClick={() => setModalProcedure(null)}
                className="p-1 rounded-lg text-content-dark/60 hover:text-content-dark hover:bg-black/5 transition-colors cursor-pointer border-0 bg-transparent outline-none"
              >
                <Icon name="fi-rr-cross" size={16} />
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 my-4 border border-black/5">
              <p className="text-sm font-primary text-content-dark leading-relaxed m-0">
                {modalProcedure.description}
              </p>
            </div>

            <div className="text-right text-base font-bold font-accented text-content-dark mb-5">
              {modalProcedure.priceFormatted}
            </div>

            <button
              type="button"
              onClick={handleBookFromModal}
              className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-base font-accented font-semibold transition-colors flex items-center justify-center cursor-pointer border-0 outline-none shadow-xs"
            >
              Записатися
            </button>

            <button
              type="button"
              onClick={() => setModalProcedure(null)}
              className="w-full text-center text-sm font-accented font-medium text-content-dark hover:text-terracotta transition-colors mt-3 bg-transparent border-0 cursor-pointer outline-none"
            >
              Додати ще процедуру
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingProcedureStep;
