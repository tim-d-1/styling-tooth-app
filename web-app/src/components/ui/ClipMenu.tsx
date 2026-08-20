import { useState, useEffect, useRef, type FC } from 'react';
import Icon from './Icon';

export interface ClipMenuItem {
  id: string;
  label: string;
  icon: 'fi-rr-picture' | 'fi-rr-file' | 'fi-rr-paw' | 'fi-rr-marker';
}

export interface ClipMenuProps {
  items?: ClipMenuItem[];
  onSelect?: (item: ClipMenuItem) => void;
  className?: string;
}

export const ClipMenu: FC<ClipMenuProps> = ({ items = [], onSelect, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className={['ui-clip-menu relative w-fit', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Меню швидких дій та прикріплень"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="bg-transparent border-0 p-2 cursor-pointer flex items-center justify-center text-content-dark hover:opacity-80 transition-opacity outline-none"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Меню прикріплень"
          className="absolute bottom-[calc(100%+8px)] left-0 w-[200px] bg-white rounded-xl shadow-card border border-visit-gray overflow-hidden z-50"
        >
          {items.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-500 font-primary">
              Немає доступних дій
            </div>
          ) : (
            items.map((item) => {
              const itemId = item.id || `clip-${item.icon}-${item.label.trim().toLowerCase().replace(/\s+/g, '-')}`;

              return (
                <button
                  key={itemId}
                  type="button"
                  role="menuitem"
                  aria-label={item.label?.trim() || 'Пункт меню прикріплення'}
                  onClick={() => {
                    onSelect?.(item);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-xs font-primary text-content-dark border-0 border-b border-visit-gray last:border-b-0 hover:bg-visit-gray transition-colors text-left bg-transparent outline-none"
                >
                  <Icon name={item.icon} size={16} color="var(--color-content-primary)" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ClipMenu;
