import { useState, useEffect, type FC, type ReactNode } from 'react';
import Icon from './Icon';

export interface AccordionProps {
  title: string;
  children: ReactNode;
  isExpanded?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
}

export const Accordion: FC<AccordionProps> = ({
  title,
  children,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (controlledExpanded !== undefined) {
      setInternalExpanded(controlledExpanded);
    }
  }, [controlledExpanded]);

  const handleToggle = () => {
    const nextState = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(nextState);
    }
    onToggle?.(nextState);
  };

  return (
    <div
      className={`ui-accordion bg-white rounded-[20px] p-5 shadow-card w-full max-w-[353px] flex flex-col gap-4 ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between cursor-pointer bg-transparent border-0 p-0 text-left"
      >
        <span className="text-base font-primary font-medium text-content-dark leading-snug">
          {title}
        </span>
        <span
          className={`flex items-center transition-transform duration-150 ${
            isExpanded ? 'rotate-90' : 'rotate-0'
          }`}
        >
          <Icon name="fi-rr-angle-small-right" size={24} color="var(--color-content-primary)" />
        </span>
      </button>

      {isExpanded && (
        <div className="flex flex-col gap-4">
          <div className="h-px bg-visit-gray" />
          <div className="text-sm font-primary text-content-dark leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Accordion;
