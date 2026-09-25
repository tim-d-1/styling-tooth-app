import { useState, useEffect, type FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { PetDetail } from './pet_types';
import { formatPetSubtitle, formatVisitsCount } from './pet_utils';

export interface PetProfileCardProps {
  pet: PetDetail;
  onEditClick?: () => void;
}

export const PetProfileCard: FC<PetProfileCardProps> = ({ pet, onEditClick }) => {
  const subtitle = formatPetSubtitle(pet.breed, pet.ageFormatted, pet.weightKg);
  const visitsText = formatVisitsCount(pet.visitsCount);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [pet.avatarUrl]);

  return (
    <div
      data-testid="pet-profile-card"
      className="w-full rounded-3xl p-6 text-white relative shadow-md"
      style={{
        background:
          'radial-gradient(circle at 49% 53%, rgba(60, 71, 76, 1) 0%, rgba(36, 47, 53, 1) 100%)',
      }}
    >
      <div className="relative w-24 h-24 mx-auto">
        <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-soft-blue shadow-md flex items-center justify-center bg-content-dark/60">
          {pet.avatarUrl && !avatarFailed ? (
            <img
              src={pet.avatarUrl}
              alt={pet.name}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              data-testid="default-pet-avatar"
              className="w-full h-full flex items-center justify-center text-white"
            >
              <Icon name="fi-rr-paw" size={40} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onEditClick}
          aria-label="Редагувати профіль улюбленця"
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center shadow-md cursor-pointer transition-colors outline-none"
        >
          <Icon name="fi-rr-edit" size={14} />
        </button>
      </div>

      <h2 className="font-accented font-bold text-2xl text-white text-center mt-3">
        {pet.name}
      </h2>

      {subtitle && (
        <p className="font-primary text-sm text-white/80 text-center mt-1">
          {subtitle}
        </p>
      )}

      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        <span
          data-testid="visits-badge"
          className="bg-soft-blue text-white font-primary font-medium text-xs md:text-sm px-3.5 py-1.5 rounded-xl shadow-xs"
        >
          {visitsText}
        </span>

        {pet.isVip && (
          <span
            data-testid="vip-badge"
            className="bg-terracotta text-white font-primary font-medium text-xs md:text-sm px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <span>★</span>
            <span>V.I.P Пухнастик</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default PetProfileCard;
