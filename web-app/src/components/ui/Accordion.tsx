import { useState, type FC, type ReactNode } from 'react';
import Icon from './Icon';

export interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const Accordion: FC<AccordionProps> = ({
  title,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`ui-accordion ${className}`}
      style={{
        backgroundColor: 'var(--color-surface-white)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        maxWidth: '353px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: '16px',
            fontFamily: 'var(--font-primary)',
            fontWeight: 500,
            color: 'var(--color-content-primary)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>
        <div
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon name="fi-rr-angle-small-right" size={24} color="var(--color-content-primary)" />
        </div>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '1px', backgroundColor: 'var(--color-interactive-lightgray)' }} />
          <div
            style={{
              fontSize: '14px',
              fontFamily: 'var(--font-primary)',
              color: 'var(--color-content-primary)',
              lineHeight: 1.5,
            }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Accordion;
