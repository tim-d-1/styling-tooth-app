import type { FC } from 'react';

interface ArticleItem {
  id: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
  bgColor?: string;
  type: 'shampoo' | 'paw' | 'placeholder';
}

interface ExpertAdviceGridProps {
  onArticleClick?: (id: string) => void;
}

export const ExpertAdviceGrid: FC<ExpertAdviceGridProps> = ({ onArticleClick }) => {
  const articles: ArticleItem[] = [
    {
      id: 'shampoo-guide',
      title: 'ЯК ОБРАТИ ПРАВИЛЬНИЙ ШАМПУНЬ?',
      bgImage: '/images/golden_retriever_bath.png',
      bgColor: '#E8EFFA',
      type: 'shampoo',
    },
    {
      id: 'paws-tips',
      title: '5 ПОРАД',
      subtitle: 'для здорових лап',
      bgImage: '/images/dog_paw_close_up.png',
      bgColor: '#96B3E2',
      type: 'paw',
    },
    {
      id: 'fur-care',
      title: 'СЕКРЕТИ ШОВКОВИСТОЇ ШЕРСТІ',
      subtitle: 'Правила розчісування вдома',
      bgColor: '#DDE2E7',
      type: 'placeholder',
    },
  ];

  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto 4rem auto',
        padding: '0 2rem',
      }}
    >
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          fontFamily: 'var(--font-accented)',
          marginBottom: '1rem',
          color: 'var(--color-content-primary)',
        }}
      >
        Поради експертів
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {articles.map((article) => {
          if (article.type === 'shampoo') {
            return (
              <div
                key={article.id}
                onClick={() => onArticleClick?.(article.id)}
                style={{
                  position: 'relative',
                  height: '212px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                  backgroundColor: '#E8EFFA',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.5rem',
                  boxSizing: 'border-box',
                }}
              >
                <img
                  src={article.bgImage}
                  alt={article.title}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    height: '100%',
                    maxHeight: '212px',
                    width: 'auto',
                    objectFit: 'cover',
                    objectPosition: 'right center',
                    zIndex: 1,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, #E8EFFA 35%, rgba(232,239,250,0.85) 55%, rgba(232,239,250,0) 85%)',
                    zIndex: 2,
                  }}
                />

                <div style={{ position: 'relative', zIndex: 3, maxWidth: '200px' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#242F35',
                      lineHeight: 1.3,
                      fontFamily: 'var(--font-primary)',
                    }}
                  >
                    {article.title}
                  </h3>
                </div>
              </div>
            );
          }

          if (article.type === 'paw') {
            return (
              <div
                key={article.id}
                onClick={() => onArticleClick?.(article.id)}
                style={{
                  position: 'relative',
                  height: '212px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                  backgroundColor: article.bgColor || '#96B3E2',
                  backgroundImage: `url("${article.bgImage}")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right bottom',
                  backgroundSize: 'contain',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '1.5rem',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '200px' }}>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: '#1A2938',
                      lineHeight: 1.1,
                      fontFamily: 'var(--font-accented)',
                    }}
                  >
                    {article.title}
                  </div>
                  {article.subtitle && (
                    <p
                      style={{
                        margin: '0.25rem 0 0 0',
                        fontSize: '1.125rem',
                        fontWeight: 500,
                        color: '#1A2938',
                        fontFamily: 'var(--font-primary)',
                      }}
                    >
                      {article.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div
              key={article.id}
              onClick={() => onArticleClick?.(article.id)}
              style={{
                position: 'relative',
                height: '212px',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: article.bgColor || '#DDE2E7',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '1.5rem',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem' }}>✂️</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--color-content-primary)',
                  }}
                >
                  {article.title}
                </h3>
                {article.subtitle && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666' }}>
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
