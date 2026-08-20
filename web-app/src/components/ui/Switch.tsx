import type { FC } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export const Switch: FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
  id,
  ariaLabel,
}) => {
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={['ui-switch inline-flex items-center gap-3', className].filter(Boolean).join(' ')}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label || 'Перемикач'}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          'ui-switch__track w-13 h-7 rounded-full bg-visit-gray relative cursor-pointer transition-colors p-0.5 inline-flex items-center border-0 outline-none',
          checked ? 'ui-switch__track--checked bg-terracotta' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={[
            'ui-switch__handle w-6 h-6 rounded-full bg-white shadow-xs transition-transform duration-150',
            checked ? 'ui-switch__handle--checked translate-x-6' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      {label && (
        <label htmlFor={switchId} className="ui-switch__label text-sm font-primary text-content-dark cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;
