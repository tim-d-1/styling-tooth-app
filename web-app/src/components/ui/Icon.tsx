import type { FC, HTMLAttributes } from 'react';
import '@flaticon/flaticon-uicons/css/regular/rounded.css';

export type IconName = string;

export interface IconProps extends HTMLAttributes<HTMLElement> {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

export const Icon: FC<IconProps> = ({
  name,
  size = 20,
  color = 'currentColor',
  className,
  style,
  ...props
}) => {
  const iconClass = name.startsWith('fi-') ? `fi ${name}` : `fi fi-rr-${name}`;

  return (
    <i
      className={[iconClass, className].filter(Boolean).join(' ')}
      style={{
        fontSize: `${size}px`,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        ...style,
      }}
      {...props}
    />
  );
};

export default Icon;
