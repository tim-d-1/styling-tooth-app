import { useState, type FC } from 'react';
import Icon from './Icon';

export interface PaymentMethod {
  id: string;
  type: 'apple-pay' | 'card';
  title: string;
  subtitle: string;
  isPrimary?: boolean;
}

export interface PaymentMethodsListProps {
  methods?: PaymentMethod[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const DEFAULT_METHODS: PaymentMethod[] = [
  {
    id: 'apple-pay',
    type: 'apple-pay',
    title: 'Apple Pay',
    subtitle: 'Основний спосіб',
    isPrimary: true,
  },
  {
    id: 'mastercard-4821',
    type: 'card',
    title: '•••• 4821',
    subtitle: 'Термін: 08/28',
    isPrimary: false,
  },
];

export const PaymentMethodsList: FC<PaymentMethodsListProps> = ({
  methods = DEFAULT_METHODS,
  selectedId = 'apple-pay',
  onSelect,
  onDelete,
  className = '',
}) => {
  const [selected, setSelected] = useState(selectedId);

  return (
    <div
      className={`ui-payment-methods ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '345px',
      }}
    >
      {methods.map((method) => {
        const isSelected = method.id === selected;

        return (
          <div
            key={method.id}
            onClick={() => {
              setSelected(method.id);
              onSelect?.(method.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: '16px',
              border: '0.8px solid var(--color-interactive-lightgray)',
              boxShadow: 'var(--shadow-card)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '64px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-surface-white)',
                  border: '1px solid var(--color-content-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={method.type === 'card' ? 'fi-rr-credit-card' : 'fi-rr-record'}
                  size={20}
                  color="var(--color-content-primary)"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-content-primary)' }}>
                  {method.title}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: method.isPrimary ? 'var(--color-status-success)' : 'var(--color-content-primary)',
                  }}
                >
                  {method.subtitle}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSelected ? (
                <Icon name="fi-rr-record" size={20} color="var(--color-interactive-primary)" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(method.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--color-content-primary)',
                  }}
                >
                  <Icon name="fi-rr-trash" size={20} color="var(--color-content-primary)" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentMethodsList;
