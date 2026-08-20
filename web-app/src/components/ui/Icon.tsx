import type { FC, HTMLAttributes } from 'react';

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
  color,
  className,
  ...props
}) => {
  const iconClass = name.startsWith('fi-') ? `fi ${name}` : `fi fi-rr-${name}`;

  return (
    <i
      className={[
        iconClass,
        'inline-flex items-center justify-center leading-none select-none text-[20px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        fontSize: size !== 20 ? `${size}px` : undefined,
        color: color || undefined,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

export default Icon;
