import type { FC } from 'react';

export interface LandingAboutProps {
  onBookClick?: () => void;
}

export const LandingAbout: FC<LandingAboutProps> = ({ onBookClick }) => {
  return (
    <section id="about" className="w-full py-20 bg-landing-page">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-[122px]">
        <div className="w-full lg:max-w-[489px] flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h2 className="font-accented font-bold text-3xl md:text-[40px] leading-tight text-content-dark">
              Хто ми
            </h2>
            <p className="font-accented text-base leading-relaxed text-content-dark">
              Стильний Зубець — простір турботи та краси для вашого улюбленця.
            </p>
            <p className="font-accented text-base leading-relaxed text-content-dark">
              Професійний грумінг з увагою до деталей, комфорту та індивідуальних
              потреб кожного хвостика. Дбайливо працюємо з шерстю, кігтями та
              шкірою, щоб улюбленець не лише виглядав чудово, а й почувався
              комфортно.
            </p>
            <p className="font-accented text-base leading-relaxed text-content-dark">
              Турбота, яку видно.
            </p>
          </div>

          <button
            type="button"
            onClick={onBookClick}
            className="w-full h-12 rounded-xl bg-terracotta hover:bg-terracotta-hover text-surface-cream font-accented font-semibold text-base flex items-center justify-center transition-colors shadow-sm cursor-pointer"
          >
            Записати улюбленця
          </button>
        </div>

        <div className="w-full lg:w-[559px] h-[300px] md:h-[349px] shrink-0 rounded-[10px] overflow-hidden shadow-card">
          <picture>
            <source srcSet="/assets/images/landing-about-dog.webp" type="image/webp" />
            <img
              src="/assets/images/landing-about-dog.png"
              alt="Собака у грумінг салоні Стильний Зубець"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </picture>
        </div>
      </div>
    </section>
  );
};

export default LandingAbout;
