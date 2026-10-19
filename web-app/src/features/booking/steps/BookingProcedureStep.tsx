import { useState, type FC } from 'react';
import BookingProgressBar from '../components/BookingProgressBar';
import ProcedureDetailCard from '../components/ProcedureDetailCard';
import Icon from '@/components/ui/Icon';
import { PROCEDURES_CATALOG, type ProcedureOption } from '../booking_types';

export interface BookingProcedureStepProps {
  procedures?: ProcedureOption[];
  selectedProcedureId?: string;
  selectedProcedureIds?: string[];
  onSelectProcedure: (procedure: ProcedureOption) => void;
  onAddProcedure?: (procedure: ProcedureOption) => void;
  onRemoveProcedure?: (procedureId: string) => void;
  onNext: () => void;
}

export const BookingProcedureStep: FC<BookingProcedureStepProps> = ({
  procedures = PROCEDURES_CATALOG,
  selectedProcedureId,
  selectedProcedureIds,
  onSelectProcedure,
  onAddProcedure,
  onRemoveProcedure,
  onNext,
}) => {
  const effectiveSelectedIds =
    selectedProcedureIds && selectedProcedureIds.length > 0
      ? selectedProcedureIds
      : selectedProcedureId
      ? [selectedProcedureId]
      : [];

  const selectedProceduresList = procedures.filter((p) =>
    effectiveSelectedIds.includes(p.id)
  );
  const selectedProcedure = selectedProceduresList[0];
  const [modalProcedure, setModalProcedure] = useState<ProcedureOption | null>(null);
  const [isMultiMode, setIsMultiMode] = useState<boolean>(
    () => effectiveSelectedIds.length > 1
  );

  const totalSelectedPrice = selectedProceduresList.reduce(
    (sum, p) => sum + (p.price || 0),
    0
  );
  const totalSelectedDuration = selectedProceduresList.reduce(
    (sum, p) => sum + (p.durationMin || 0),
    0
  );

  const handleProcedureClick = (proc: ProcedureOption) => {
    if (isMultiMode || effectiveSelectedIds.length > 1) {
      if (!effectiveSelectedIds.includes(proc.id)) {
        if (onAddProcedure) {
          onAddProcedure(proc);
        } else {
          onSelectProcedure(proc);
        }
      }
    } else {
      onSelectProcedure(proc);
    }
    setModalProcedure(proc);
  };

  const handleBookFromModal = () => {
    if (modalProcedure) {
      if (!effectiveSelectedIds.includes(modalProcedure.id)) {
        if (isMultiMode && onAddProcedure) {
          onAddProcedure(modalProcedure);
        } else {
          onSelectProcedure(modalProcedure);
        }
      }
      setModalProcedure(null);
      onNext();
    }
  };

  const handleAddMoreFromModal = () => {
    if (modalProcedure) {
      setIsMultiMode(true);
      if (!effectiveSelectedIds.includes(modalProcedure.id)) {
        if (onAddProcedure) {
          onAddProcedure(modalProcedure);
        } else {
          onSelectProcedure(modalProcedure);
        }
      }
      setModalProcedure(null);
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
          const isSelected = effectiveSelectedIds.includes(proc.id);
          return (
            <button
              key={proc.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleProcedureClick(proc)}
              className={[
                'h-12 w-full rounded-[10px] text-base font-accented transition-colors flex items-center justify-center cursor-pointer outline-none px-3',
                isSelected
                  ? 'bg-terracotta border border-terracotta text-white font-semibold shadow-xs'
                  : 'bg-white border border-[#242F35] text-content-dark hover:border-terracotta hover:text-terracotta',
              ].join(' ')}
            >
              <span className="truncate">{proc.name}</span>
            </button>
          );
        })}
      </div>

      {selectedProceduresList.length > 0 && (
        <div className="mt-6 bg-[#FFFBF6] border border-black/5 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs sm:text-sm font-accented font-semibold text-content-dark">
            <span>Обрано послуг: {selectedProceduresList.length}</span>
            <span className="text-terracotta font-bold text-sm sm:text-base">
              {totalSelectedPrice.toLocaleString('uk-UA')} ₴ • {totalSelectedDuration} хв
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedProceduresList.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black/10 text-xs font-accented font-medium text-content-dark shadow-2xs"
              >
                <span>{p.name}</span>
                {selectedProceduresList.length > 1 && onRemoveProcedure && (
                  <button
                    type="button"
                    aria-label={`Видалити послугу ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveProcedure(p.id);
                    }}
                    className="p-0.5 hover:text-terracotta cursor-pointer border-0 bg-transparent text-content-dark/60 leading-none"
                  >
                    <Icon name="fi-rr-cross" size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedProcedure && selectedProceduresList.length === 1 && !modalProcedure && (
        <div className="mt-6">
          <ProcedureDetailCard procedure={selectedProcedure} />
        </div>
      )}

      <div className="mt-8 sm:mt-12">
        <button
          type="button"
          onClick={onNext}
          disabled={effectiveSelectedIds.length === 0}
          className={[
            'w-full h-12 rounded-xl text-base font-accented font-semibold transition-colors flex items-center justify-center border-0 outline-none',
            effectiveSelectedIds.length > 0
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
              onClick={handleAddMoreFromModal}
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
