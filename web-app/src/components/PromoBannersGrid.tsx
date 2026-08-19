import type { FC } from 'react';
import Button from './ui/Button';

interface PromoBannersGridProps {
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
    <section
      style={{
        maxWidth: '1200px',
        margin: '0 auto 3rem auto',
        padding: '0 2rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div
          onClick={onBanner1Click}
          style={{
            position: 'relative',
            height: '240px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            backgroundImage: 'url("/images/promo_grooming_tools.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
              zIndex: 1,
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              НА ПЕРШИЙ ГРУМІНГ
            </span>
            <div
              style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.1,
                marginTop: '0.25rem',
              }}
            >
              -25%
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <Button
              variant="primary"
              size="sm"
              style={{
                backgroundColor: '#EC643A',
                borderRadius: '12px',
                padding: '0.5rem 1.25rem',
              }}
            >
              Детальніше
            </Button>
          </div>
        </div>

        <div
          onClick={onBanner2Click}
          style={{
            position: 'relative',
            height: '240px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)',
            backgroundImage: 'url("/images/promo_nail_trimming.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1.5rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)',
              zIndex: 1,
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '280px' }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#EC643A',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Безкоштовне
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: '#FFFFFF',
                lineHeight: 1.3,
              }}
            >
              підстригання кігтів при комплексному грумінгу
            </p>
          </div>
        </div>

        <div
          onClick={onBanner3Click}
          style={{
            position: 'relative',
            height: '240px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#DDE2E7',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>📱</span>
            <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--color-content-primary)' }}>
              Мобільний застосунок
            </strong>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              Керуйте візитами та бонусами 24/7
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBannersGrid;
