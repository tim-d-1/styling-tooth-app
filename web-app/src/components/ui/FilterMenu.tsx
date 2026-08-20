import { useState, type FC, type ReactNode } from 'react';

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
}

export const FilterMenu: FC<FilterMenuProps> = ({
  options = [],
  selectedId,
  onSelect,
  placeholder = 'Вибрати фільтр',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.id === selectedId);

  return (
    <div className={['ui-filter-menu', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="ui-filter-menu__trigger"
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
        <div className="ui-filter-menu__dropdown" role="listbox">
          {options.map((option) => {
            const isSelected = option.id === selectedId;

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect?.(option);
                  setIsOpen(false);
                }}
                className={`ui-filter-menu__item w-full text-left bg-transparent border-0 ${
                  isSelected ? 'ui-filter-menu__item--selected' : ''
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterMenu;
