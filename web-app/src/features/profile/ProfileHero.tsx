import type { FC } from 'react';
import Icon from '@/components/ui/Icon';

export interface ProfileHeroProps {
  userName?: string;
  onBookClick?: () => void;
  onHomeClick?: () => void;
}

export const ProfileHero: FC<ProfileHeroProps> = ({
  userName,
  onBookClick,
  onHomeClick,
}) => {
  const greeting = userName?.trim() ? `Вітаємо, ${userName.trim()}! 👋` : 'Вітаємо! 👋';

  return (
    <div className="w-full flex flex-col gap-4">
      <nav aria-label="Хлібні крихти" className="flex items-center gap-1.5 text-xs font-primary">
        <button
          type="button"
          onClick={onHomeClick}
          className="text-content-dark hover:text-terracotta transition-colors bg-transparent border-0 p-0 cursor-pointer outline-none"
        >
          Головна
        </button>
        <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
        <span className="text-terracotta font-medium" aria-current="page">
          Особистий кабінет
        </span>
      </nav>

      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark tracking-tight">
          {greeting}
        </h1>

        <button
          type="button"
          onClick={onBookClick}
          className="w-full md:w-[24.1875rem] h-12 px-6 rounded-xl bg-terracotta hover:bg-terracotta-hover active:scale-[0.99] text-white font-accented font-semibold text-base flex items-center justify-center transition-all shadow-xs cursor-pointer border-0 outline-none"
        >
          Записатися на грумінг
        </button>
      </div>
    </div>
  );
};

export default ProfileHero;
