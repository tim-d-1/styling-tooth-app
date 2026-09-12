import type { FC } from 'react';
import Button from './ui/Button';

export interface PromoBannersGridProps {
  onBanner1Click?: () => void;
  onBanner2Click?: () => void;
  onBanner3Click?: () => void;
  className?: string;
}

export const PromoBannersGrid: FC<PromoBannersGridProps> = ({
  onBanner1Click,
  onBanner2Click,
  onBanner3Click,
  className,
}) => {
  return (
    <section className={['max-w-[1200px] mx-auto mb-12 px-6 sm:px-8', className].filter(Boolean).join(' ')}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <article
          className="relative min-h-[15rem] h-auto rounded-3xl overflow-hidden shadow-md flex flex-col justify-between p-6 hover:scale-[1.01] transition-transform duration-200 text-left"
        >
          <img
            src="/assets/images/promo_grooming_tools.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none pointer-events-none"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10 pointer-events-none" />

          <div className="relative z-20">
            <span className="text-sm font-bold text-white tracking-wider uppercase block">
              НА ПЕРШИЙ ГРУМІНГ
            </span>
            <div className="text-5xl font-extrabold text-white leading-tight mt-1 font-accented">
              -25%
            </div>
          </div>

          <div className="relative z-20">
            <Button
              variant="primary"
              size="sm"
              aria-label="Знижка 25% на перший грумінг: Детальніше"
              onClick={onBanner1Click}
              className="bg-terracotta rounded-xl px-5 py-2 hover:bg-terracotta-hover transition-colors"
            >
              Детальніше
            </Button>
          </div>
        </article>

        <button
          type="button"
          onClick={onBanner2Click}
          aria-label="Безкоштовне підстригання кігтів при комплексному грумінгу"
          className="relative min-h-[15rem] h-auto rounded-3xl overflow-hidden cursor-pointer shadow-md flex flex-col justify-end p-6 hover:scale-[1.01] transition-transform duration-200 text-left outline-none border-0 bg-transparent"
        >
          <img
            src="/assets/images/promo_nail_trimming.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none pointer-events-none"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/85 z-10 pointer-events-none" />

          <div className="relative z-20 max-w-[280px]">
            <span className="text-xl font-bold text-terracotta block mb-1 font-accented">
              Безкоштовне
            </span>
            <p className="m-0 text-sm font-medium text-white leading-snug font-primary">
              підстригання кігтів при комплексному грумінгу
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onBanner3Click}
          aria-label="-20% на комплексний грумінг у будні"
          className="relative min-h-[15rem] h-auto rounded-3xl overflow-hidden bg-gradient-to-r from-[#ECEEF1] to-[#D1DCEE] cursor-pointer shadow-md flex flex-col justify-center p-6 hover:scale-[1.01] transition-transform duration-200 text-left outline-none border-0"
        >
          <img
            src="/assets/images/promo_weekday_grooming-701240.png"
            alt=""
            className="absolute right-0 top-0 h-full w-auto object-contain object-right z-10 select-none pointer-events-none"
          />
          <div className="relative z-20 max-w-[170px]">
            <span className="text-4xl font-bold text-terracotta block mb-1 font-primary">
              -20%
            </span>
            <p className="m-0 text-base font-bold text-content-dark leading-snug font-accented">
              на комплексний грумінг у будні
            </p>
          </div>
        </button>
      </div>
    </section>
  );
};

export default PromoBannersGrid;
