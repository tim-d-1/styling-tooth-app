import type { FC } from 'react';

export interface LandingHeroProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
}

export const LandingHero: FC<LandingHeroProps> = ({
  onRegisterClick,
  onLoginClick,
}) => {
  return (
    <section className="relative w-full min-h-[774px] bg-landing-hero overflow-hidden">
      <div className="absolute -left-80 -top-24 w-[923px] h-[862px] rounded-full bg-white/25 blur-[125px] pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-12 md:pt-[72px] pb-16 min-h-[774px] flex flex-col justify-between">
        <div className="inline-flex items-center gap-3">
          <img
            src="/assets/logos/logo-mark-transparent.svg"
            alt="Стильний зубець"
            className="w-[46px] h-[46px] object-contain shrink-0"
          />
          <span className="font-primary font-bold text-xl uppercase tracking-[-0.011em] text-terracotta">
            Стильний зубець
          </span>
        </div>

        <div className="my-auto pt-12 pb-16 max-w-[520px]">
          <h1 className="font-primary font-bold text-5xl md:text-[80px] leading-[1.05] md:leading-[73px] tracking-[-0.011em] text-content-dark uppercase">
            ПРЕМІУМ
            <br />
            ГРУМІНГ
          </h1>
          <p className="mt-5 font-primary text-xl md:text-[25px] leading-snug tracking-[-0.011em] text-content-dark uppercase">
            без черг і дзвінків
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={onRegisterClick}
              className="w-full sm:w-[167px] h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-surface-cream font-accented font-semibold text-base flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              Реєстрація
            </button>
            <button
              type="button"
              onClick={onLoginClick}
              className="w-full sm:w-[167px] h-12 rounded-xl bg-soft-blue hover:opacity-90 text-surface-cream font-accented font-semibold text-base flex items-center justify-center transition-opacity shadow-sm cursor-pointer"
            >
              Увійти
            </button>
          </div>
        </div>

        <div className="hidden md:block" />
      </div>

      <div className="relative lg:absolute lg:top-0 lg:right-0 w-full lg:w-[55%] xl:w-[715px] h-[350px] sm:h-[420px] lg:h-full pointer-events-none flex items-end justify-end">
        <picture className="w-full h-full flex items-end justify-end">
          <source srcSet="/assets/images/landing-hero-dog.webp" type="image/webp" />
          <img
            src="/assets/images/landing-hero-dog.png"
            alt="Преміум грумінг для собак"
            className="w-full h-full object-contain object-bottom lg:object-right-bottom"
          />
        </picture>
      </div>
    </section>
  );
};

export default LandingHero;
