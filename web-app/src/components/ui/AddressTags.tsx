import { useState, type FC } from 'react';

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

const DEFAULT_TAGS: AddressTagOption[] = [
  { id: 'home', label: '🏡 Дім' },
  { id: 'office', label: '💼 Офіс' },
];

export const AddressTags: FC<AddressTagsProps> = ({
  options = DEFAULT_TAGS,
  selectedId = 'home',
  onChange,
  className = '',
}) => {
  const [selected, setSelected] = useState(selectedId);

  return (
    <div
      className={`ui-address-tags ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: '353px',
      }}
    >
      {options.map((opt) => {
        const isActive = opt.id === selected;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setSelected(opt.id);
              onChange?.(opt.id);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: isActive ? 'none' : '0.8px solid var(--color-content-primary)',
              backgroundColor: isActive ? 'var(--color-surface-accent)' : 'transparent',
              color: isActive ? 'var(--color-surface-white)' : 'var(--color-content-primary)',
              fontSize: '14px',
              fontFamily: 'var(--font-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default AddressTags;
