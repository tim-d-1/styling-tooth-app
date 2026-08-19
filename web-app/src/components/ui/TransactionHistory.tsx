import { useState, type FC } from 'react';
import Icon, { type IconName } from './Icon';

export type TransactionFilter = 'all' | 'earned' | 'spent';

export interface TransactionItem {
  id: string;
  title: string;
  date: string;
  amount: number;
  icon: IconName;
  type: 'earned' | 'spent';
}

export interface TransactionHistoryProps {
  items?: TransactionItem[];
  className?: string;
}

const DEFAULT_TRANSACTIONS: TransactionItem[] = [
  {
    id: '1',
    title: 'Комплексний грумінг (Мальтипу)',
    date: '18 Липня 2026',
    amount: 240,
    icon: 'fi-rr-barber-shop',
    type: 'earned',
  },
  {
    id: '2',
    title: 'Спа + Заспокійлива маска',
    date: '02 Липня 2026',
    amount: -400,
    icon: 'fi-rr-spa',
    type: 'spent',
  },
  {
    id: '3',
    title: 'Експрес-лінька & Догляд за кігтями',
    date: '25 Червня 2026',
    amount: 60,
    icon: 'fi-rr-paw',
    type: 'earned',
  },
];

export const TransactionHistory: FC<TransactionHistoryProps> = ({
  items = DEFAULT_TRANSACTIONS,
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'earned') return item.type === 'earned';
    if (activeFilter === 'spent') return item.type === 'spent';
    return true;
  });

  return (
    <div
      className={`ui-transaction-history ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '353px',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            border: activeFilter === 'all' ? 'none' : '1px solid var(--color-content-primary)',
            backgroundColor: activeFilter === 'all' ? 'var(--color-surface-accent)' : 'transparent',
            color: activeFilter === 'all' ? 'var(--color-surface-white)' : 'var(--color-content-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-primary)',
            cursor: 'pointer',
          }}
        >
          Всі
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('earned')}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            border: activeFilter === 'earned' ? 'none' : '1px solid var(--color-content-primary)',
            backgroundColor: activeFilter === 'earned' ? 'var(--color-surface-accent)' : 'transparent',
            color: activeFilter === 'earned' ? 'var(--color-surface-white)' : 'var(--color-content-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-primary)',
            cursor: 'pointer',
          }}
        >
          Нараховано
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('spent')}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            border: activeFilter === 'spent' ? 'none' : '1px solid var(--color-content-primary)',
            backgroundColor: activeFilter === 'spent' ? 'var(--color-surface-accent)' : 'transparent',
            color: activeFilter === 'spent' ? 'var(--color-surface-white)' : 'var(--color-content-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-primary)',
            cursor: 'pointer',
          }}
        >
          Витрачено
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-interactive-lightgray)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon name={item.icon} size={20} color="var(--color-content-primary)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-content-primary)' }}>
                  {item.title}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                  {item.date}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-accented)',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: item.amount > 0 ? 'var(--color-interactive-primary)' : 'var(--color-content-primary)',
                }}
              >
                {item.amount > 0 ? `+${item.amount}` : item.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
