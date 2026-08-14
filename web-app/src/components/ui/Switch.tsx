import type { FC } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

export const Switch: FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  id,
}) => {
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`ui-switch ${className}`}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`ui-switch__track ${checked ? 'ui-switch__track--checked' : ''}`}
      >
        <span className={`ui-switch__handle ${checked ? 'ui-switch__handle--checked' : ''}`} />
      </button>
      {label && (
        <label htmlFor={switchId} className="ui-switch__label">
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch;
