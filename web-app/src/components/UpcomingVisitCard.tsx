import { useState, type FC } from 'react';
import Button from './ui/Button';
import Switch from './ui/Switch';

interface UpcomingVisitCardProps {
  dayOfWeek?: string;
  dayNumber?: string;
  timeSlot?: string;
  masterName?: string;
  procedureName?: string;
  basePrice?: number;
  transferPrice?: number;
  initialTransferEnabled?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
}

export const UpcomingVisitCard: FC<UpcomingVisitCardProps> = ({
  dayOfWeek = 'СЕР',
  dayNumber = '10',
  timeSlot = '16:00',
  masterName = 'Марія Шевченко',
  procedureName = 'Комплексний грумінг',
  basePrice = 1300,
  transferPrice = 100,
  initialTransferEnabled = false,
  onReschedule,
  onCancel,
}) => {
  const [transferEnabled, setTransferEnabled] = useState(initialTransferEnabled);

  const totalPrice = basePrice + (transferEnabled ? transferPrice : 0);

  return (
    <section
      style={{
        maxWidth: '1200px',
        margin: '1.5rem auto 2.5rem auto',
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
        Запланований візит
      </h2>

      <div
        style={{
          backgroundColor: '#ECEEF1',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Date & Procedure White Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flex: '1 1 320px',
            minWidth: '280px',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          {/* Date Column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid var(--color-interactive-lightgray)',
              paddingRight: '1.25rem',
              minWidth: '70px',
            }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-content-primary)',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-accented)',
              }}
            >
              {dayOfWeek}
            </span>
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                lineHeight: 1,
                margin: '0.25rem 0',
                color: 'var(--color-content-primary)',
              }}
            >
              {dayNumber}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-content-primary)',
              }}
            >
              {timeSlot}
            </span>
          </div>

          {/* Master & Procedure Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: '#555', display: 'block' }}>
                Майстер:
              </span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-content-primary)' }}>
                {masterName}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8125rem', color: '#555', display: 'block' }}>
                Процедура:
              </span>
              <strong style={{ fontSize: '0.9375rem', color: 'var(--color-content-primary)' }}>
                {procedureName}
              </strong>
            </div>
          </div>
        </div>

        {/* Center Price & Pet Transfer Toggle White Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '0.625rem',
            flex: '1 1 300px',
            minWidth: '260px',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem',
              color: 'var(--color-content-primary)',
            }}
          >
            <span>Вартість обраних процедур:</span>
            <strong style={{ fontSize: '0.9375rem' }}>{basePrice} ₴</strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--color-content-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Трансфер улюбленця:</span>
              <strong style={{ fontSize: '0.9375rem' }}>{transferPrice} ₴</strong>
            </div>
            <Switch
              checked={transferEnabled}
              onChange={(checked) => setTransferEnabled(checked)}
              id="pet-transfer-switch"
            />
          </div>

          {transferEnabled && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
                color: 'var(--color-interactive-primary)',
                fontWeight: 600,
                borderTop: '1px dashed var(--color-interactive-lightgray)',
                paddingTop: '0.375rem',
              }}
            >
              <span>Загалом до сплати:</span>
              <span>{totalPrice} ₴</span>
            </div>
          )}
        </div>

        {/* Right Action Buttons Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: '0 0 auto',
            minWidth: '150px',
          }}
        >
          <Button
            variant="primary"
            size="md"
            onClick={onReschedule}
            style={{ width: '100%', minWidth: '130px', backgroundColor: '#EC643A', borderRadius: '12px' }}
          >
            Перенести
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            style={{ width: '100%', minWidth: '130px', borderRadius: '12px', borderColor: '#242F35' }}
          >
            Скасувати
          </Button>
        </div>
      </div>
    </section>
  );
};

export default UpcomingVisitCard;
