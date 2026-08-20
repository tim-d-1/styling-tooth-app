import type { FC } from 'react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export const Checkbox: FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
  id,
  ariaLabel,
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={['ui-checkbox inline-flex items-center gap-2', className].filter(Boolean).join(' ')}>
      <div
        id={checkboxId}
        role="checkbox"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Прапорець'}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === ' ' || e.key === 'Enter' || e.code === 'Space')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={[
          'ui-checkbox__box w-5 h-5 rounded bg-white border border-gray-400 inline-flex items-center justify-center cursor-pointer transition-all shrink-0 outline-none',
          checked ? 'ui-checkbox__box--checked bg-terracotta border-terracotta' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {checked && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
            <path
              d="M1 4.5L4.33333 8L11 1"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          onClick={() => !disabled && onChange(!checked)}
          className="ui-checkbox__label text-sm font-primary text-content-dark cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
