import { useState, type FC } from 'react';
import Icon from './Icon';

export interface ClipMenuItem {
  id: string;
  label: string;
  icon: 'fi-rr-picture' | 'fi-rr-file' | 'fi-rr-paw' | 'fi-rr-marker';
}

export interface ClipMenuProps {
  onSelect?: (item: ClipMenuItem) => void;
  className?: string;
}

const DEFAULT_ITEMS: ClipMenuItem[] = [
  { id: 'photo', label: 'Фото або відео', icon: 'fi-rr-picture' },
  { id: 'document', label: 'Документ / Довідка', icon: 'fi-rr-file' },
  { id: 'pet', label: 'Картка улюбленця', icon: 'fi-rr-paw' },
  { id: 'location', label: 'Локація салону', icon: 'fi-rr-marker' },
];

export const ClipMenu: FC<ClipMenuProps> = ({ onSelect, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`ui-clip-menu ${className}`} style={{ position: 'relative', inlineSize: 'fit-content' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Attachment Menu"
        style={{
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-content-primary)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            width: '200px',
            backgroundColor: 'var(--color-surface-white)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-interactive-lightgray)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {DEFAULT_ITEMS.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelect?.(item);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-primary)',
                color: 'var(--color-content-primary)',
                borderBottom: '1px solid var(--color-interactive-lightgray)',
              }}
            >
              <Icon name={item.icon} size={16} color="var(--color-content-primary)" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClipMenu;
