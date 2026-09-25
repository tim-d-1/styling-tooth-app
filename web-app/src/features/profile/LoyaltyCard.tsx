import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { ProfileUser } from './profile_types';

export interface LoyaltyCardProps {
  user?: ProfileUser;
  onLoyaltyClick?: () => void;
}

export const LoyaltyCard: FC<LoyaltyCardProps> = ({
  user,
  onLoyaltyClick,
}) => {
  const name = user?.name || 'Катерина';
  const phone = user?.phone || '+380 (97) *** ** 42';
  const avatarUrl = user?.avatarUrl;
  const loyaltyTier = user?.loyaltyTier || 'Gold Level • 25% Cashback';
  const bonusPoints = user?.bonusPoints ?? 450;

  return (
    <article
      className="w-full lg:w-[24.1875rem] min-h-[15.625rem] rounded-3xl p-5 flex flex-col justify-between gap-4 text-white shadow-md relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 38% 39%, rgba(36, 47, 53, 1) 0%, rgba(60, 71, 76, 1) 100%)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-soft-blue p-0.5 shrink-0 overflow-hidden bg-content-dark flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <img
              src="/assets/images/default-avatar.svg"
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-accented font-semibold text-xl text-white truncate">
            {name}
          </span>
          <span className="font-primary text-sm text-white/80 tracking-wide">
            {phone}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onLoyaltyClick}
        className="w-full bg-soft-blue hover:bg-soft-blue/90 active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center justify-between text-left cursor-pointer border-0 outline-none"
      >
        <div className="flex flex-col items-start gap-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-terracotta text-white font-primary text-xs font-medium">
            {loyaltyTier}
          </span>

          <div className="flex items-baseline gap-1.5 text-white">
            <span className="font-accented font-bold text-2xl leading-none">
              {bonusPoints.toLocaleString('uk-UA')}
            </span>
            <span className="font-primary text-sm">бонусів</span>
          </div>
        </div>

        <Icon name="fi-rr-angle-small-right" size={24} className="text-white shrink-0" />
      </button>
    </article>
  );
};

export default LoyaltyCard;
