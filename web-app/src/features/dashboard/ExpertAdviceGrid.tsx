import type { FC } from 'react';

export interface ArticleItem {
  id: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
  bgColor?: string;
  logo?: string;
  type: 'shampoo' | 'paw' | 'walk';
}

export interface ExpertAdviceGridProps {
  articles?: ArticleItem[];
  onArticleClick?: (id: string) => void;
  className?: string;
}

export const ExpertAdviceGrid: FC<ExpertAdviceGridProps> = ({
  articles = [],
  onArticleClick,
  className,
}) => {
  return (
    <section className={['max-w-[1200px] mx-auto mb-16 px-6 sm:px-8', className].filter(Boolean).join(' ')}>
      <h2 className="text-2xl font-semibold font-accented mb-4 text-content-dark">
        Поради експертів
      </h2>

      {articles.length === 0 ? (
        <div className="p-8 bg-visit-gray/50 rounded-2xl text-center text-sm font-primary text-gray-500">
          Немає доступних порад
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {articles.map((article) => {
            const articleId = article.id || `article-${article.title.trim().toLowerCase().replace(/\s+/g, '-')}`;
            const effectiveBgImage = article.bgImage?.trim();
            const label = article.subtitle
              ? `${article.title} - ${article.subtitle}`
              : article.title;

            if (article.type === 'shampoo') {
              return (
                <button
                  key={articleId}
                  type="button"
                  onClick={() => onArticleClick?.(articleId)}
                  aria-label={label}
                  className="relative min-h-[13.25rem] h-auto rounded-xl overflow-hidden cursor-pointer shadow-md bg-soft-ice flex flex-col justify-start p-6 pt-7 hover:scale-[1.01] transition-transform duration-200 text-left outline-none border-0"
                >
                  {effectiveBgImage && (
                    <img
                      src={effectiveBgImage}
                      alt=""
                      className="absolute right-0 top-0 h-full max-h-[13.25rem] w-auto object-cover object-right z-10 select-none pointer-events-none"
                    />
                  )}

                  <div
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to left, rgba(232, 239, 250, 0) 0px, rgba(232, 239, 250, 0) 88px, rgba(232, 239, 250, 0.85) 126px, #e8effa 148px, #e8effa 100%)',
                    }}
                  />

                  <div className="relative z-30 max-w-[240px]">
                    <h3 className="m-0 text-xl font-bold text-content-dark leading-snug font-primary">
                      {article.title}
                    </h3>
                  </div>
                </button>
              );
            }

            if (article.type === 'walk') {
              return (
                <button
                  key={articleId}
                  type="button"
                  onClick={() => onArticleClick?.(articleId)}
                  aria-label={label}
                  className="relative min-h-[13.25rem] h-auto rounded-xl overflow-hidden cursor-pointer shadow-md bg-gradient-to-r from-terracotta to-[#D63A0A] flex flex-col justify-between p-5 hover:scale-[1.01] transition-transform duration-200 text-left outline-none border-0"
                >
                  {article.logo && (
                    <img
                      src={article.logo}
                      alt=""
                      className="w-12 h-12 object-contain select-none pointer-events-none z-20"
                    />
                  )}
                  {effectiveBgImage && (
                    <img
                      src={effectiveBgImage}
                      alt=""
                      className="absolute right-0 top-0 h-full max-h-[13.25rem] w-auto object-cover object-right z-10 select-none pointer-events-none"
                    />
                  )}
                  <div className="relative z-20 max-w-[200px] mt-auto">
                    <h3 className="m-0 text-lg font-bold text-surface-cream leading-snug font-accented">
                      {article.title}
                    </h3>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={articleId}
                type="button"
                onClick={() => onArticleClick?.(articleId)}
                aria-label={label}
                className="relative min-h-[13.25rem] h-auto rounded-xl overflow-hidden cursor-pointer shadow-md bg-soft-blue flex flex-col justify-start p-6 pt-7 hover:scale-[1.01] transition-transform duration-200 text-left outline-none border-0"
              >
                <img
                  src="/assets/images/expert_advice_paws_bg.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none pointer-events-none"
                />
                {effectiveBgImage && (
                  <img
                    src={effectiveBgImage}
                    alt=""
                    className="absolute right-0 bottom-0 max-h-[13.25rem] w-auto object-contain object-right-bottom z-10 select-none pointer-events-none"
                  />
                )}
                <div className="relative z-20 max-w-[240px]">
                  <div className="text-3xl font-extrabold text-navy-dark leading-none font-accented">
                    {article.title}
                  </div>
                  {article.subtitle && (
                    <p className="mt-1 mb-0 text-lg font-medium text-white whitespace-nowrap font-primary">
                      {article.subtitle}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ExpertAdviceGrid;
