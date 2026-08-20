import { useState, useEffect, type FC } from 'react';
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

export const PaymentMethodsList: FC<PaymentMethodsListProps> = ({
  methods = [],
  selectedId,
  onSelect,
  onDelete,
  className,
}) => {
  const [internalSelected, setInternalSelected] = useState(selectedId);

  const selected = selectedId !== undefined ? selectedId : internalSelected;

  useEffect(() => {
    if (selectedId !== undefined) {
      setInternalSelected(selectedId);
    }
  }, [selectedId]);

  const handleSelect = (id: string) => {
    if (selectedId === undefined) {
      setInternalSelected(id);
    }
    onSelect?.(id);
  };

  return (
    <div className={['ui-payment-methods flex flex-col gap-3 w-full max-w-[345px]', className].filter(Boolean).join(' ')}>
      {methods.map((method) => {
        const isSelected = method.id === selected;

        return (
          <div
            key={method.id}
            role="button"
            tabIndex={0}
            aria-label={`Обрати спосіб оплати: ${method.title}`}
            onClick={() => handleSelect(method.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(method.id);
              }
            }}
            className={`flex items-center justify-between p-4 bg-white rounded-2xl border shadow-card cursor-pointer transition-colors ${
              isSelected ? 'border-terracotta' : 'border-visit-gray hover:border-soft-blue'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-8 rounded bg-white border border-content-dark flex items-center justify-center">
                <Icon
                  name={method.type === 'card' ? 'fi-rr-credit-card' : 'fi-rr-record'}
                  size={20}
                  color="var(--color-content-primary)"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-content-dark">
                  {method.title}
                </span>
                <span
                  className={`text-xs ${
                    method.isPrimary ? 'text-green-600 font-medium' : 'text-content-dark'
                  }`}
                >
                  {method.subtitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isSelected ? (
                <Icon name="fi-rr-record" size={20} color="var(--color-interactive-primary)" />
              ) : (
                <button
                  type="button"
                  aria-label={`Видалити спосіб оплати ${method.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(method.id);
                  }}
                  className="bg-transparent border-0 cursor-pointer p-1 text-content-dark hover:text-red-500 transition-colors"
                >
                  <Icon name="fi-rr-trash" size={20} color="currentColor" />
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
