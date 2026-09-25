import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { ProfilePet } from './profile_types';

export interface MyPetsSectionProps {
  pets?: ProfilePet[];
  onAddPetClick?: () => void;
  onPetClick?: (pet: ProfilePet) => void;
}

export const MyPetsSection: FC<MyPetsSectionProps> = ({
  pets = [],
  onAddPetClick,
  onPetClick,
}) => {
  return (
    <section aria-labelledby="my-pets-heading" className="w-full flex flex-col gap-6">
      <h2
        id="my-pets-heading"
        className="font-accented font-bold text-xl md:text-2xl text-content-dark"
      >
        Мої улюбленці
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <article
            key={pet.id}
            onClick={() => onPetClick?.(pet)}
            className="w-full min-h-[15.625rem] bg-white rounded-3xl p-6 shadow-sm border border-black/5 flex flex-col items-center justify-between text-center gap-4 transition-all hover:shadow-md cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-soft-blue/20 flex items-center justify-center shrink-0">
              {pet.avatarUrl ? (
                <img
                  src={pet.avatarUrl}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  data-testid={`pet-avatar-${pet.id}`}
                  className="w-full h-full flex items-center justify-center text-terracotta"
                >
                  <Icon name="fi-rr-paw" size={36} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="font-accented font-semibold text-xl text-content-dark">
                {pet.name}
              </span>
              <span className="font-primary text-sm text-content-dark/80">
                {pet.breed || pet.species}
                {pet.ageFormatted ? ` • ${pet.ageFormatted}` : ''}
              </span>
            </div>

            {pet.lastVisitFormatted ? (
              <span className="inline-block px-3 py-1 rounded-xl bg-soft-blue text-white font-primary text-xs">
                Останній візит: {pet.lastVisitFormatted}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-xl bg-gray-100 text-text-muted font-primary text-xs">
                Немає попередніх візитів
              </span>
            )}
          </article>
        ))}

        <button
          type="button"
          onClick={onAddPetClick}
          className="w-full min-h-[15.625rem] bg-white hover:bg-soft-blue/5 rounded-3xl p-6 border-2 border-dashed border-soft-blue flex flex-col items-center justify-center gap-6 transition-all cursor-pointer group outline-none"
        >
          <div className="w-10 h-10 rounded-full border-2 border-soft-blue group-hover:border-terracotta text-soft-blue group-hover:text-terracotta flex items-center justify-center transition-colors">
            <Icon name="fi-rr-plus" size={20} />
          </div>
          <span className="font-accented font-semibold text-xl text-content-dark group-hover:text-terracotta transition-colors">
            Додати улюбленця
          </span>
        </button>
      </div>
    </section>
  );
};

export default MyPetsSection;
