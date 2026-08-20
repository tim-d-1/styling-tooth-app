import type { FC } from 'react';
import Button from './ui/Button';

export interface PromoBannersGridProps {
  onBanner1Click?: () => void;
  onBanner2Click?: () => void;
  onBanner3Click?: () => void;
}

export const PromoBannersGrid: FC<PromoBannersGridProps> = ({
  onBanner1Click,
  onBanner2Click,
  onBanner3Click,
}) => {
  return (
    <section className="max-w-[1200px] mx-auto mb-12 px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          role="button"
          tabIndex={0}
          onClick={onBanner1Click}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onBanner1Click?.();
            }
          }}
          aria-label="Знижка 25% на перший грумінг"
          className="relative h-[240px] rounded-3xl overflow-hidden cursor-pointer shadow-md bg-cover bg-center flex flex-col justify-between p-6 bg-[url('/assets/images/promo_grooming_tools.png')] hover:scale-[1.01] transition-transform duration-200 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10" />

          <div className="relative z-20">
            <span className="text-sm font-bold text-white tracking-wider uppercase block">
              НА ПЕРШИЙ ГРУМІНГ
            </span>
            <div className="text-5xl font-extrabold text-white leading-tight mt-1">
              -25%
            </div>
          </div>

          <div className="relative z-20">
            <Button
              variant="primary"
              size="sm"
              className="bg-terracotta rounded-xl px-5 py-2 hover:bg-[#d8552d] transition-colors"
            >
              Детальніше
            </Button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onBanner2Click}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onBanner2Click?.();
            }
          }}
          aria-label="Безкоштовне підстригання кігтів при комплексному грумінгу"
          className="relative h-[240px] rounded-3xl overflow-hidden cursor-pointer shadow-md bg-cover bg-center flex flex-col justify-end p-6 bg-[url('/assets/images/promo_nail_trimming.png')] hover:scale-[1.01] transition-transform duration-200 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/85 z-10" />

          <div className="relative z-20 max-w-[280px]">
            <span className="text-xl font-bold text-terracotta block mb-1">
              Безкоштовне
            </span>
            <p className="m-0 text-sm font-medium text-white leading-snug">
              підстригання кігтів при комплексному грумінгу
            </p>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onBanner3Click}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.code === 'Space') {
              e.preventDefault();
              onBanner3Click?.();
            }
          }}
          aria-label="Мобільний застосунок: Керуйте візитами та бонусами 24/7"
          className="relative h-[240px] rounded-3xl overflow-hidden bg-advice-gray shadow-md flex items-center justify-center p-4 cursor-pointer hover:bg-[#d5dbe1] transition-colors text-center"
        >
          <div>
            <span className="text-2xl block mb-2">📱</span>
            <strong className="text-base block text-content-dark">
              Мобільний застосунок
            </strong>
            <span className="text-sm text-gray-600">
              Керуйте візитами та бонусами 24/7
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBannersGrid;
