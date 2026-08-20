import type { FC } from 'react';

export interface ArticleItem {
  id: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
  bgColor?: string;
  type: 'shampoo' | 'paw';
}

export interface ExpertAdviceGridProps {
  articles?: ArticleItem[];
  onArticleClick?: (id: string) => void;
}

export const ExpertAdviceGrid: FC<ExpertAdviceGridProps> = ({
  articles = [],
  onArticleClick,
}) => {
  return (
    <section className="max-w-[1200px] mx-auto mb-16 px-8">
      <h2 className="text-2xl font-semibold font-accented mb-4 text-content-dark">
        Поради експертів
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {articles.map((article) => {
          const effectiveBgImage = article.bgImage?.trim();
          const label = article.subtitle
            ? `${article.title} - ${article.subtitle}`
            : article.title;

          if (article.type === 'shampoo') {
            return (
              <div
                key={article.id}
                role="button"
                tabIndex={0}
                onClick={() => onArticleClick?.(article.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    onArticleClick?.(article.id);
                  }
                }}
                aria-label={label}
                className="relative h-[212px] rounded-[10px] overflow-hidden cursor-pointer shadow-md bg-soft-ice flex items-center p-6 hover:scale-[1.01] transition-transform duration-200 text-left"
              >
                {effectiveBgImage && (
                  <img
                    src={effectiveBgImage}
                    alt=""
                    className="absolute right-0 top-0 h-full max-h-[212px] w-auto object-cover object-right z-10"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-soft-ice via-soft-ice/80 to-transparent z-20" />

                <div className="relative z-30 max-w-[200px]">
                  <h3 className="m-0 text-xl font-bold text-content-dark leading-snug font-primary">
                    {article.title}
                  </h3>
                </div>
              </div>
            );
          }

          return (
            <div
              key={article.id}
              role="button"
              tabIndex={0}
              onClick={() => onArticleClick?.(article.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.code === 'Space') {
                  e.preventDefault();
                  onArticleClick?.(article.id);
                }
              }}
              aria-label={label}
              className="relative h-[212px] rounded-[10px] overflow-hidden cursor-pointer shadow-md bg-soft-blue flex flex-col justify-center p-6 hover:scale-[1.01] transition-transform duration-200 text-left"
            >
              {effectiveBgImage && (
                <img
                  src={effectiveBgImage}
                  alt=""
                  className="absolute right-0 bottom-0 max-h-[212px] w-auto object-contain object-right-bottom z-10"
                />
              )}
              <div className="relative z-20 max-w-[200px]">
                <div className="text-3xl font-extrabold text-[#1A2938] leading-none font-accented">
                  {article.title}
                </div>
                {article.subtitle && (
                  <p className="mt-1 mb-0 text-lg font-medium text-[#1A2938] font-primary">
                    {article.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ExpertAdviceGrid;
