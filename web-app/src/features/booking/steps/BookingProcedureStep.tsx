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
  viewingProcedure?: ProcedureOption | null;
  onViewProcedureChange?: (procedure: ProcedureOption | null) => void;
}

export const BookingProcedureStep: FC<BookingProcedureStepProps> = ({
  procedures = PROCEDURES_CATALOG,
  selectedProcedureId,
  selectedProcedureIds,
  onSelectProcedure,
  onAddProcedure,
  onRemoveProcedure,
  onNext,
  viewingProcedure: controlledViewingProcedure,
  onViewProcedureChange,
}) => {
  const effectiveSelectedIds =
    selectedProcedureIds !== undefined
      ? selectedProcedureIds
      : selectedProcedureId
      ? [selectedProcedureId]
      : [];

  const [internalViewingProcedure, setInternalViewingProcedure] =
    useState<ProcedureOption | null>(null);

  const activeViewingProcedure =
    controlledViewingProcedure !== undefined
      ? controlledViewingProcedure
      : internalViewingProcedure;

  const setViewingProcedure = (proc: ProcedureOption | null) => {
    if (onViewProcedureChange) {
      onViewProcedureChange(proc);
    } else {
      setInternalViewingProcedure(proc);
    }
  };

  const handleProcedureClick = (proc: ProcedureOption) => {
    if (effectiveSelectedIds.includes(proc.id)) {
      if (onRemoveProcedure) {
        onRemoveProcedure(proc.id);
      }
      return;
    }
    setViewingProcedure(proc);
  };

  const handleBookProcedure = () => {
    if (activeViewingProcedure) {
      if (!effectiveSelectedIds.includes(activeViewingProcedure.id)) {
        if (effectiveSelectedIds.length > 0 && onAddProcedure) {
          onAddProcedure(activeViewingProcedure);
        } else {
          onSelectProcedure(activeViewingProcedure);
        }
      }
      setViewingProcedure(null);
      onNext();
    }
  };

  const handleAddMoreProcedure = () => {
    if (activeViewingProcedure) {
      if (!effectiveSelectedIds.includes(activeViewingProcedure.id)) {
        if (onAddProcedure) {
          onAddProcedure(activeViewingProcedure);
        } else {
          onSelectProcedure(activeViewingProcedure);
        }
      }
      setViewingProcedure(null);
    }
  };

  if (activeViewingProcedure) {
    return (
      <ProcedureDetailCard
        procedure={activeViewingProcedure}
        onBook={handleBookProcedure}
        onAddMore={handleAddMoreProcedure}
      />
    );
  }

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
    </div>
  );
};

export default BookingProcedureStep;
