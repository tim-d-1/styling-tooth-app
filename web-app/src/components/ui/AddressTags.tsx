import { useState, type FC } from 'react';

export interface AddressTagOption {
  id: string;
  label: string;
}

export interface AddressTagsProps {
  options?: AddressTagOption[];
  tags?: AddressTagOption[];
  selectedId?: string;
  selectedIds?: string[];
  defaultSelectedId?: string;
  defaultSelectedIds?: string[];
  onChange?: (id: string) => void;
  onToggle?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const AddressTags: FC<AddressTagsProps> = ({
  options,
  tags,
  selectedId: controlledSelectedId,
  selectedIds: controlledSelectedIds,
  defaultSelectedId,
  defaultSelectedIds,
  onChange,
  onToggle,
  className,
  ariaLabel = 'Теги адреси',
}) => {
  const items = tags || options || [];
  const initialSelected = controlledSelectedId ?? defaultSelectedId ?? (defaultSelectedIds?.[0] ?? '');
  const [internalSelected, setInternalSelected] = useState<string>(initialSelected);

  const activeSelected = controlledSelectedId !== undefined
    ? controlledSelectedId
    : (controlledSelectedIds?.[0] !== undefined ? controlledSelectedIds[0] : internalSelected);

  const handleSelect = (id: string) => {
    if (controlledSelectedId === undefined && controlledSelectedIds === undefined) {
      setInternalSelected(id);
    }
    onChange?.(id);
    onToggle?.(id);
  };

  if (items.length === 0) {
    return (
      <div className={['ui-address-tags-empty text-xs text-gray-500 font-primary py-2', className].filter(Boolean).join(' ')}>
        Немає доступних адресних тегів
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={['ui-address-tags flex flex-wrap items-center gap-3 w-full max-w-[353px]', className]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((opt) => {
        const optId = opt.id || `address-tag-${opt.label.trim().toLowerCase().replace(/\s+/g, '-')}`;
        const isActive = optId === activeSelected;

        return (
          <button
            key={optId}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(optId)}
            className={[
              'px-4 min-h-[2.5rem] h-auto py-2 rounded-xl text-sm font-primary cursor-pointer flex items-center justify-center transition-colors duration-150 border outline-none',
              isActive
                ? 'bg-soft-blue text-white border-transparent'
                : 'bg-transparent border-content-dark text-content-dark hover:bg-visit-gray',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default AddressTags;
