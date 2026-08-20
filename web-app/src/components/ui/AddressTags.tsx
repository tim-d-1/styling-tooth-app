import { useState, useEffect, type FC } from 'react';

export interface AddressTagOption {
  id: string;
  label: string;
}

export interface AddressTagsProps {
  options?: AddressTagOption[];
  selectedId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export const AddressTags: FC<AddressTagsProps> = ({
  options = [],
  selectedId,
  onChange,
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
    onChange?.(id);
  };

  return (
    <div className={['ui-address-tags flex items-center gap-3 w-full max-w-[353px]', className].filter(Boolean).join(' ')}>
      {options.map((opt) => {
        const isActive = opt.id === selected;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            className={`px-4 h-10 rounded-xl text-sm font-primary cursor-pointer flex items-center justify-center transition-colors duration-150 ${
              isActive
                ? 'bg-soft-blue text-white border-0'
                : 'bg-transparent border border-content-dark text-content-dark hover:bg-visit-gray'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default AddressTags;
