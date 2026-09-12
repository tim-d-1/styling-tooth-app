import type { FC, HTMLAttributes } from 'react';

export type AppIconName =
  | 'fi-rr-confetti'
  | 'fi-rr-raindrops'
  | 'fi-rr-clock'
  | 'fi-rr-barber-shop'
  | 'fi-rr-magic-wand'
  | 'fi-rr-paw'
  | 'fi-rr-snowflake'
  | 'fi-rr-scissors'
  | 'paws';

export interface AppIconProps extends HTMLAttributes<HTMLSpanElement> {
  name: AppIconName;
  className?: string;
}

const iconClassMap: Record<AppIconName, string> = {
  'fi-rr-confetti': 'icon-mask--confetti',
  'fi-rr-raindrops': 'icon-mask--raindrops',
  'fi-rr-clock': 'icon-mask--clock',
  'fi-rr-barber-shop': 'icon-mask--barber-shop',
  'fi-rr-magic-wand': 'icon-mask--magic-wand',
  'fi-rr-paw': 'icon-mask--paw',
  'fi-rr-snowflake': 'icon-mask--snowflake',
  'fi-rr-scissors': 'icon-mask--scissors',
  paws: 'icon-mask--paws',
};

export const AppIcon: FC<AppIconProps> = ({
  name,
  className = '',
  ...props
}) => {
  const specificClass = iconClassMap[name] || '';
  const sizeClasses = /\bw-|\bh-/.test(className) ? '' : 'w-6 h-6';
  return (
    <span
      className={`icon-mask ${specificClass} ${sizeClasses} ${className}`.trim()}
      aria-hidden="true"
      {...props}
    />
  );
};

export default AppIcon;
