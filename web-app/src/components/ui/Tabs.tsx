import { useState, useEffect, useRef, type FC, type KeyboardEvent } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  items?: TabItem[];
  className?: string;
  ariaLabel?: string;
}

export const Tabs: FC<TabsProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  items = [],
  className,
  ariaLabel = 'Вкладки',
}) => {
  const initialValue = defaultValue ?? (items.length > 0 ? items[0].id : '');
  const [internalValue, setInternalValue] = useState<string>(initialValue);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const enabledItems = items.filter((item) => !item.disabled);

  const handleSelect = (id: string) => {
    if (controlledValue === undefined) {
      setInternalValue(id);
    }
    onChange?.(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (enabledItems.length === 0) return;

    let targetIndex = -1;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % enabledItems.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = enabledItems.length - 1;
    }

    if (targetIndex >= 0) {
      const nextItem = enabledItems[targetIndex];
      const nextId = nextItem.id || `tab-${targetIndex}`;
      handleSelect(nextId);
      tabRefs.current.get(nextId)?.focus();
    }
  };

  if (items.length === 0) {
    return (
      <div className={['ui-tabs-empty p-4 text-center text-xs text-gray-500 font-primary', className].filter(Boolean).join(' ')}>
        Немає доступних вкладок
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        'ui-tabs flex items-center gap-2 p-1.5 bg-visit-gray/70 rounded-2xl w-full max-w-[360px] overflow-x-auto',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item, index) => {
        const itemId = item.id || `tab-${index}`;
        const isSelected = itemId === activeValue;
        const enabledIndex = enabledItems.findIndex((it) => (it.id || `tab-${index}`) === itemId);

        return (
          <button
            key={itemId}
            ref={(el) => {
              if (el) {
                tabRefs.current.set(itemId, el);
              } else {
                tabRefs.current.delete(itemId);
              }
            }}
            id={`tab-${itemId}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`tabpanel-${itemId}`}
            tabIndex={isSelected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => handleSelect(itemId)}
            onKeyDown={(e) => handleKeyDown(e, enabledIndex >= 0 ? enabledIndex : 0)}
            className={[
              'flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-primary font-medium transition-all cursor-pointer border-0 outline-none',
              isSelected
                ? 'bg-white text-terracotta shadow-xs font-semibold'
                : 'bg-transparent text-content-dark hover:text-terracotta hover:bg-white/50',
              item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={[
                  'text-xs px-1.5 py-0.5 rounded-full font-accented',
                  isSelected ? 'bg-terracotta/10 text-terracotta font-bold' : 'bg-gray-200 text-content-dark',
                ].join(' ')}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
