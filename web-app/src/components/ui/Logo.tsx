import type { FC, CSSProperties } from 'react';

export type LogoVariant =
  | 'full-light'
  | 'full-dark'
  | 'full-dark-mono'
  | 'full-transparent'
  | 'mark-light'
  | 'mark-dark'
  | 'mark-dark-mono'
  | 'mark-transparent'
  | 'logo-01'
  | 'logo-02'
  | 'logo-03'
  | 'logo-04'
  | 'logo-05'
  | 'logo-06'
  | 'logo-without-fon-01'
  | 'logo-without-fon-02';

export interface LogoProps {
  variant?: LogoVariant;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const logoFileMap: Record<LogoVariant, string> = {
  'full-light': '/assets/logos/logo-full-light.svg',
  'full-dark': '/assets/logos/logo-full-dark.svg',
  'full-dark-mono': '/assets/logos/logo-full-dark-mono.svg',
  'full-transparent': '/assets/logos/logo-full-transparent.svg',
  'mark-light': '/assets/logos/logo-mark-light.svg',
  'mark-dark': '/assets/logos/logo-mark-dark.svg',
  'mark-dark-mono': '/assets/logos/logo-mark-dark-mono.svg',
  'mark-transparent': '/assets/logos/logo-mark-transparent.svg',
  'logo-01': '/assets/logos/logo-full-light.svg',
  'logo-02': '/assets/logos/logo-full-dark.svg',
  'logo-03': '/assets/logos/logo-full-dark-mono.svg',
  'logo-04': '/assets/logos/logo-mark-light.svg',
  'logo-05': '/assets/logos/logo-mark-dark.svg',
  'logo-06': '/assets/logos/logo-mark-dark-mono.svg',
  'logo-without-fon-01': '/assets/logos/logo-full-transparent.svg',
  'logo-without-fon-02': '/assets/logos/logo-mark-transparent.svg',
};

export const Logo: FC<LogoProps> = ({
  variant = 'full-transparent',
  alt = 'Стильний Зубець Logo',
  width,
  height = 44,
  className,
}) => {
  const src = logoFileMap[variant] || logoFileMap['full-transparent'];

  const customStyle: CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: width ? (typeof width === 'number' ? `${width}px` : width) : 'auto',
  };

  return (
    <img
      src={src}
      alt={alt}
      style={customStyle}
      className={['object-contain max-h-none', className].filter(Boolean).join(' ')}
      loading="lazy"
    />
  );
};

export default Logo;
