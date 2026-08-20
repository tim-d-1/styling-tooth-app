import { useState, useEffect, useRef, type FC, type ReactNode } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface FilterMenuProps {
  options?: FilterOption[];
  selectedId?: string;
  onSelect?: (option: FilterOption) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export const FilterMenu: FC<FilterMenuProps> = ({
  options = [],
  selectedId,
  onSelect,
  placeholder = 'Вибрати фільтр',
  className,
  ariaLabel = 'Меню вибору фільтра',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.id === selectedId);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={['ui-filter-menu relative w-full max-w-[353px]', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="w-full min-h-[2.5rem] h-auto px-4 py-2 rounded-xl bg-white border border-visit-gray shadow-subtle flex items-center justify-between cursor-pointer font-primary text-sm text-content-dark transition-colors hover:border-soft-blue outline-none"
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="var(--color-content-primary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-xl shadow-modal overflow-hidden border border-visit-gray max-h-60 overflow-y-auto"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 font-primary">
              Немає доступних опцій
            </div>
          ) : (
            options.map((option, index) => {
              const optionId = option.id || `filter-${index}`;
              const isSelected = optionId === selectedId;

              return (
                <button
                  key={optionId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect?.(option);
                    setIsOpen(false);
                  }}
                  className={[
                    'w-full min-h-[3rem] h-auto px-4 py-3 flex items-center gap-3 cursor-pointer text-base font-primary font-medium text-left border-0 border-b border-visit-gray last:border-b-0 transition-colors outline-none',
                    isSelected
                      ? 'bg-surface-cream text-terracotta font-semibold'
                      : 'bg-transparent text-content-dark hover:bg-visit-gray',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FilterMenu;
