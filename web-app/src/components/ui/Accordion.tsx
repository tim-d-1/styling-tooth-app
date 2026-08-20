import { useState, type FC, type ReactNode } from 'react';
import Icon from './Icon';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onToggle?: (id: string) => void;
  items?: AccordionItem[];
  className?: string;
  allowMultiple?: boolean;
}

export const Accordion: FC<AccordionProps> = ({
  expandedIds: controlledExpandedIds,
  defaultExpandedIds = [],
  onToggle,
  items = [],
  className,
  allowMultiple = true,
}) => {
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>(defaultExpandedIds);

  const expandedIds = controlledExpandedIds !== undefined ? controlledExpandedIds : internalExpandedIds;

  const handleToggle = (id: string) => {
    if (controlledExpandedIds === undefined) {
      setInternalExpandedIds((prev) => {
        const isExpanded = prev.includes(id);
        if (isExpanded) {
          return prev.filter((item) => item !== id);
        }
        return allowMultiple ? [...prev, id] : [id];
      });
    }
    onToggle?.(id);
  };

  if (items.length === 0) {
    return (
      <div className={['ui-accordion-empty text-xs text-gray-500 font-primary py-3 text-center', className].filter(Boolean).join(' ')}>
        Немає елементів акордеону
      </div>
    );
  }

  return (
    <div className={['ui-accordion flex flex-col gap-3 w-full max-w-[353px]', className].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const itemId = item.id || `accordion-${item.title.trim().toLowerCase().replace(/\s+/g, '-')}`;
        const isExpanded = expandedIds.includes(itemId);
        const headerId = `accordion-header-${itemId}`;
        const panelId = `accordion-panel-${itemId}`;

        return (
          <div
            key={itemId}
            className={[
              'bg-white rounded-2xl p-5 shadow-card transition-all duration-200 border border-visit-gray/50 flex flex-col gap-4',
              item.disabled ? 'opacity-50 pointer-events-none' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              id={headerId}
              type="button"
              aria-expanded={isExpanded}
              aria-controls={panelId}
              disabled={item.disabled}
              onClick={() => handleToggle(itemId)}
              className="w-full flex items-center justify-between cursor-pointer bg-transparent border-0 p-0 text-left outline-none"
            >
              <span className="text-base font-primary font-medium text-content-dark leading-snug">
                {item.title}
              </span>
              <span
                className={`flex items-center transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : 'rotate-0'
                }`}
              >
                <Icon name="fi-rr-angle-small-right" size={24} color="var(--color-content-primary)" />
              </span>
            </button>

            {isExpanded && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className="flex flex-col gap-4 pt-1"
              >
                <div className="h-px bg-visit-gray" />
                <div className="text-sm font-primary text-content-dark leading-relaxed">
                  {item.content}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
