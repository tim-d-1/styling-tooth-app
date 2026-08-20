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
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const PaymentMethodsList: FC<PaymentMethodsListProps> = ({
  methods = [],
  selectedId: controlledSelectedId,
  defaultSelectedId,
  onSelect,
  onDelete,
  className,
}) => {
  const initialSelected = controlledSelectedId ?? defaultSelectedId ?? (methods[0]?.id ?? '');
  const [internalSelected, setInternalSelected] = useState<string>(initialSelected);

  const selected = controlledSelectedId !== undefined ? controlledSelectedId : internalSelected;

  useEffect(() => {
    if (controlledSelectedId !== undefined) {
      setInternalSelected(controlledSelectedId);
    }
  }, [controlledSelectedId]);

  const handleSelect = (id: string) => {
    if (controlledSelectedId === undefined) {
      setInternalSelected(id);
    }
    onSelect?.(id);
  };

  if (methods.length === 0) {
    return (
      <div className={['ui-payment-methods-empty p-6 bg-visit-gray/50 rounded-2xl text-center text-sm font-primary text-gray-500 max-w-[345px] w-full', className].filter(Boolean).join(' ')}>
        Немає збережених способів оплати
      </div>
    );
  }

  return (
    <div className={['ui-payment-methods flex flex-col gap-3 w-full max-w-[345px]', className].filter(Boolean).join(' ')}>
      {methods.map((method, index) => {
        const methodId = method.id || `method-${index}`;
        const isSelected = methodId === selected;

        return (
          <div
            key={methodId}
            role="button"
            tabIndex={0}
            aria-label={`Обрати спосіб оплати: ${method.title}`}
            aria-pressed={isSelected}
            onClick={() => handleSelect(methodId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                handleSelect(methodId);
              }
            }}
            className={[
              'flex items-center justify-between p-4 bg-white rounded-2xl border shadow-card cursor-pointer transition-colors min-h-[4.5rem] h-auto outline-none',
              isSelected ? 'border-terracotta' : 'border-visit-gray hover:border-soft-blue',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="flex items-center gap-3">
              <div className="w-16 min-h-[2rem] h-auto py-1 rounded bg-white border border-content-dark flex items-center justify-center">
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
                  aria-label={`Видалити збережений спосіб оплати: ${method.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(methodId);
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
