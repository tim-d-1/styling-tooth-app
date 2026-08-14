import type { FC } from 'react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

export const Checkbox: FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  id,
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`ui-checkbox ${className}`}>
      <div
        id={checkboxId}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`ui-checkbox__box ${checked ? 'ui-checkbox__box--checked' : ''}`}
      >
        {checked && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
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
          className="ui-checkbox__label"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
