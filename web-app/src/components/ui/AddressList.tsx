import type { FC, ReactNode } from 'react';

export interface MethodItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
}

export interface AddressListProps {
  items?: MethodItem[];
  selectedId?: string;
  onSelect?: (item: MethodItem) => void;
  className?: string;
}

export const AddressList: FC<AddressListProps> = ({
  items = [],
  selectedId,
  onSelect,
  className,
}) => {
  if (items.length === 0) {
    return (
      <div className={['ui-address-list-empty p-6 bg-visit-gray/50 rounded-2xl text-center text-sm font-primary text-gray-500 max-w-[353px] w-full', className].filter(Boolean).join(' ')}>
        Список адрес порожній
      </div>
    );
  }

  return (
    <div className={['ui-address-list flex flex-col gap-3 w-full max-w-[353px]', className].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const itemId = item.id || `address-${item.title.trim().toLowerCase().replace(/\s+/g, '-')}`;
        const isSelected = itemId === selectedId;

        return (
          <button
            key={itemId}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect?.(item)}
            className={[
              'ui-address-card flex items-center gap-3 p-4 rounded-xl bg-white border shadow-subtle cursor-pointer transition-all text-left outline-none min-h-[4rem] h-auto',
              isSelected
                ? 'bg-visit-gray border-soft-blue'
                : 'border-visit-gray hover:border-soft-blue',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div
              className={[
                'ui-address-card__icon w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                isSelected
                  ? 'bg-soft-blue text-white'
                  : 'bg-visit-gray text-content-dark',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.icon || (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>

            <div className="ui-address-card__content flex-1">
              <div className="ui-address-card__top flex items-center justify-between gap-2">
                <span className="ui-address-card__title text-base font-semibold font-primary text-content-dark">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="ui-address-card__badge text-xs px-2 py-0.5 rounded-full bg-terracotta text-white font-accented">
                    {item.badge}
                  </span>
                )}
              </div>
              {item.subtitle && (
                <span className="ui-address-card__subtitle text-xs text-gray-500 font-primary block mt-0.5">
                  {item.subtitle}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default AddressList;
