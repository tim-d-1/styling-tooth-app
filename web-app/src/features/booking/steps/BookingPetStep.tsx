import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import BookingProgressBar from '../components/BookingProgressBar';
import type { PetOption } from '../booking_types';

export interface BookingPetStepProps {
  pets: PetOption[];
  selectedPetId?: string;
  onSelectPet: (pet: PetOption) => void;
  onAddPetClick: () => void;
  onNext: () => void;
}

export const BookingPetStep: FC<BookingPetStepProps> = ({
  pets,
  selectedPetId,
  onSelectPet,
  onAddPetClick,
  onNext,
}) => {
  return (
    <div className="flex flex-col">
      <h1 className="text-2xl sm:text-[1.625rem] font-bold text-content-dark font-accented leading-snug mb-8 sm:mb-10">
        Оберіть улюбленця
      </h1>

      <div
        role="radiogroup"
        aria-label="Оберіть улюбленця"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
      >
        <button
          type="button"
          onClick={onAddPetClick}
          aria-label="Додати нового улюбленця"
          className="aspect-square w-full rounded-2xl border-2 border-dashed border-[#B2B2B2] hover:border-terracotta hover:text-terracotta transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer bg-transparent text-content-dark group outline-none"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-visit-gray group-hover:bg-soft-ice transition-colors">
            <Icon name="fi-rr-plus" size={22} color="currentColor" />
          </div>
          <span className="font-accented font-semibold text-sm sm:text-base leading-tight">
            Додати нового улюбленця
          </span>
        </button>

        {pets.map((pet) => {
          const isSelected = pet.id === selectedPetId;
          return (
            <button
              key={pet.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectPet(pet)}
              className={[
                'aspect-square w-full rounded-2xl overflow-hidden relative border-2 transition-all flex flex-col cursor-pointer p-0 text-left outline-none bg-white',
                isSelected
                  ? 'border-terracotta ring-2 ring-terracotta/30 shadow-md'
                  : 'border-[#ECEEF1] hover:border-terracotta/50 shadow-xs',
              ].join(' ')}
            >
              <div className="relative w-full flex-1 bg-visit-gray overflow-hidden flex items-center justify-center">
                {pet.avatar_url ? (
                  <img
                    src={pet.avatar_url}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-terracotta shadow-xs">
                    <Icon name="fi-rr-paw" size={32} color="#EC643A" />
                  </div>
                )}
              </div>

              <div className="p-3 bg-white flex items-center justify-between border-t border-[#ECEEF1]/60">
                <div className="min-w-0 pr-2">
                  <div className="font-accented font-bold text-sm sm:text-base text-content-dark truncate">
                    {pet.name}
                  </div>
                  {pet.breed && (
                    <div className="font-primary text-xs text-text-muted truncate">
                      {pet.breed}
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div
                    aria-hidden="true"
                    className="w-6 h-6 rounded-full bg-terracotta text-white flex items-center justify-center shrink-0"
                  >
                    <Icon name="fi-rr-check" size={12} color="#FFFFFF" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedPetId}
          className={[
            'w-full h-12 rounded-xl text-base font-accented font-semibold transition-colors flex items-center justify-center border-0 outline-none',
            selectedPetId
              ? 'bg-terracotta hover:bg-terracotta-hover text-white cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          Далі
        </button>
      </div>

      <BookingProgressBar currentStep={1} />
    </div>
  );
};

export default BookingPetStep;
