import type { FC } from 'react';
import DetailCardLayout from '@/components/layout/DetailCardLayout';
import {
  PROMOS_REGISTRY,
  DEFAULT_PROMO_ID,
  type PromoData,
} from './promo_types';

export interface PromoDetailPageProps {
  promoId?: string;
  promo?: PromoData;
  isLoggedIn?: boolean;
  userName?: string;
  userAvatarUrl?: string;
  onBackClick?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onQuickBookClick?: () => void;
}

export const PromoDetailPage: FC<PromoDetailPageProps> = ({
  promoId,
  promo,
  isLoggedIn = false,
  userName,
  userAvatarUrl,
  onBackClick,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onQuickBookClick,
}) => {
  const activePromo =
    promo ||
    (promoId && PROMOS_REGISTRY[promoId]) ||
    PROMOS_REGISTRY[DEFAULT_PROMO_ID];

  return (
    <DetailCardLayout
      isLoggedIn={isLoggedIn}
      userName={userName}
      userAvatarUrl={userAvatarUrl}
      onBackClick={onBackClick}
      onLoginClick={onLoginClick}
      onRegisterClick={onRegisterClick}
      onProfileClick={onProfileClick}
    >
      <div className="flex flex-col">
        <div className="bg-visit-gray rounded-[10px] p-6 sm:py-7 sm:px-10 mb-6">
          <span className="text-3xl sm:text-4xl font-bold font-accented text-terracotta block mb-2 leading-tight">
            {activePromo.highlightPrefix}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-accented text-content-dark m-0 leading-snug">
            {activePromo.highlightTitle}
          </h1>
        </div>

        <p className="text-base font-semibold font-accented text-content-dark leading-relaxed mb-6">
          {activePromo.description}
        </p>

        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold font-accented text-content-dark mb-4">
            {activePromo.sectionTitle}
          </h2>
          <ul className="space-y-2 list-none p-0 m-0">
            {activePromo.items.map((item, idx) => (
              <li
                key={idx}
                className="text-base font-semibold font-accented text-content-dark leading-relaxed flex items-start gap-2"
              >
                <span aria-hidden="true" className="select-none text-content-dark/60 font-mono">
                  -
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onQuickBookClick}
          className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover transition-colors text-white font-accented font-semibold text-base flex items-center justify-center cursor-pointer border-0 outline-none shadow-sm active:scale-[0.99]"
        >
          {activePromo.buttonText}
        </button>
      </div>
    </DetailCardLayout>
  );
};

export default PromoDetailPage;
