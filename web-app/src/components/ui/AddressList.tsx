import type { FC, ReactNode } from 'react';

export interface MethodItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
}

export interface AddressListProps {
  items: MethodItem[];
  selectedId?: string;
  onSelect?: (item: MethodItem) => void;
  className?: string;
}

export const AddressList: FC<AddressListProps> = ({
  items,
  selectedId,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`ui-address-list ${className}`}>
      {items.map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <div
            key={item.id}
            onClick={() => onSelect?.(item)}
            className={`ui-address-card ${isSelected ? 'ui-address-card--selected' : ''}`}
          >
            <div className="ui-address-card__icon">
              {item.icon || (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>

            <div className="ui-address-card__content">
              <div className="ui-address-card__top">
                <span className="ui-address-card__title">{item.title}</span>
                {item.badge && <span className="ui-address-card__badge">{item.badge}</span>}
              </div>
              {item.subtitle && (
                <span className="ui-address-card__subtitle">{item.subtitle}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AddressList;
