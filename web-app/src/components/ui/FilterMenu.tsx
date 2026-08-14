import { useState, type FC, type ReactNode } from 'react';

export interface FilterOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface FilterMenuProps {
  options: FilterOption[];
  selectedId?: string;
  onSelect?: (option: FilterOption) => void;
  placeholder?: string;
  className?: string;
}

export const FilterMenu: FC<FilterMenuProps> = ({
  options,
  selectedId,
  onSelect,
  placeholder = 'Вибрати фільтр',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.id === selectedId);

  return (
    <div className={`ui-filter-menu ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ui-filter-menu__trigger"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
          }}
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
        <div className="ui-filter-menu__dropdown">
          {options.map((option) => {
            const isSelected = option.id === selectedId;

            return (
              <div
                key={option.id}
                onClick={() => {
                  onSelect?.(option);
                  setIsOpen(false);
                }}
                className={`ui-filter-menu__item ${
                  isSelected ? 'ui-filter-menu__item--selected' : ''
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterMenu;
