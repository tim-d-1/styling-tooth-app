import { useState, type FC } from 'react';
import BookingProgressBar from '../components/BookingProgressBar';
import ProcedureDetailCard from '../components/ProcedureDetailCard';
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
  onNext,
}) => {
  const effectiveSelectedIds =
    selectedProcedureIds && selectedProcedureIds.length > 0
      ? selectedProcedureIds
      : selectedProcedureId
      ? [selectedProcedureId]
      : [];

  const [modalProcedure, setModalProcedure] = useState<ProcedureOption | null>(null);

  const handleProcedureClick = (proc: ProcedureOption) => {
    setModalProcedure(proc);
  };

  const handleBookFromModal = () => {
    if (modalProcedure) {
      if (!effectiveSelectedIds.includes(modalProcedure.id)) {
        if (effectiveSelectedIds.length > 0 && onAddProcedure) {
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
      <h1 className="text-2xl sm:text-[1.5rem] font-bold text-content-dark font-accented leading-snug mb-8 sm:mb-10">
        Обери процедуру
      </h1>

      <div
        role="radiogroup"
        aria-label="Оберіть процедуру"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
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
                'h-12 w-full text-base font-accented transition-colors flex items-center justify-center cursor-pointer outline-none px-3',
                isSelected
                  ? 'bg-terracotta border border-terracotta text-[#FFFBF6] font-semibold rounded-[12px] shadow-xs'
                  : 'bg-white border border-[#B2B2B2] text-content-dark hover:border-terracotta hover:text-terracotta rounded-[10px]',
              ].join(' ')}
            >
              <span className="truncate">{proc.name}</span>
            </button>
          );
        })}
      </div>

      <BookingProgressBar currentStep={2} />

      {modalProcedure && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="procedure-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#ECEEF1]/85 p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setModalProcedure(null)}
        >
          <ProcedureDetailCard
            procedure={modalProcedure}
            onBook={handleBookFromModal}
            onAddMore={handleAddMoreFromModal}
          />
        </div>
      )}
    </div>
  );
};

export default BookingProcedureStep;
