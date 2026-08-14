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
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    const wrapperClasses = [
      'ui-input__wrapper',
      variant === 'filled' ? 'ui-input__wrapper--filled' : '',
      error ? 'ui-input__wrapper--error' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`ui-input ${className}`}>
        {label && (
          <label htmlFor={inputId} className="ui-input__label">
            {label}
          </label>
        )}
        <div className={wrapperClasses}>
          {leftIcon}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className="ui-input__field"
            {...props}
          />
          {rightIcon}
        </div>
        {(error || helperText) && (
          <span className={`ui-input__helper ${error ? 'ui-input__helper--error' : ''}`}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
