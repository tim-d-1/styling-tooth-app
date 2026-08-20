import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'outline' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'outline',
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    const helperId = `${inputId}-helper`;

    const wrapperClasses = [
      'ui-input__wrapper flex items-center gap-3 min-h-[3.5rem] h-auto px-4 rounded-xl border transition-colors',
      variant === 'filled' ? 'bg-visit-gray border-transparent' : 'bg-white border-content-dark',
      error ? 'border-red-500' : 'focus-within:border-terracotta',
      disabled ? 'opacity-50 cursor-not-allowed bg-visit-gray/50' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={['ui-input flex flex-col gap-1.5 w-full max-w-[353px]', className].filter(Boolean).join(' ')}>
        {label && (
          <label htmlFor={inputId} className="ui-input__label text-xs font-primary font-semibold uppercase text-gray-500">
            {label}
          </label>
        )}
        <div className={wrapperClasses}>
          {leftIcon}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error || helperText ? helperId : undefined}
            className="ui-input__field flex-1 h-full border-0 outline-none bg-transparent font-primary text-sm text-content-dark placeholder:text-gray-400"
            {...props}
          />
          {rightIcon}
        </div>
        {(error || helperText) && (
          <span
            id={helperId}
            role={error ? 'alert' : undefined}
            className={`ui-input__helper text-xs font-primary ${error ? 'text-red-500' : 'text-gray-500'}`}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
