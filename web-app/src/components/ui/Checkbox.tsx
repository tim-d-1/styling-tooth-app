import { useId, type FC, type ChangeEvent } from 'react';

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
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className={['ui-checkbox inline-flex items-center gap-2', className].filter(Boolean).join(' ')}>
      <div className="relative inline-flex items-center justify-center">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          aria-label={ariaLabel || (!label ? 'Прапорець' : undefined)}
          className="sr-only peer"
        />
        <label
          htmlFor={checkboxId}
          aria-hidden="true"
          className={[
            'ui-checkbox__box w-5 h-5 rounded bg-white border border-gray-400 inline-flex items-center justify-center transition-all shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta peer-focus-visible:ring-offset-2',
            checked ? 'ui-checkbox__box--checked bg-terracotta border-terracotta text-white' : '',
            disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {checked && (
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
              <path
                d="M1 4.5L4.33333 8L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </label>
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={[
            'ui-checkbox__label text-sm font-primary text-content-dark select-none',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
