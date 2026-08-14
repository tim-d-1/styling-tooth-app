import type { FC } from 'react';

export type LogoVariant =
  | 'logo-01'
  | 'logo-02'
  | 'logo-03'
  | 'logo-04'
  | 'logo-05'
  | 'logo-06'
  | 'logo-without-fon-01'
  | 'logo-without-fon-02';

interface LogoProps {
  variant?: LogoVariant;
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const logoFileMap: Record<LogoVariant, string> = {
  'logo-01': '/logos/logo-01 1.svg',
  'logo-02': '/logos/logo-02 1.svg',
  'logo-03': '/logos/logo-03 1.svg',
  'logo-04': '/logos/logo-04 1.svg',
  'logo-05': '/logos/logo-05 1.svg',
  'logo-06': '/logos/logo-06 1.svg',
  'logo-without-fon-01': '/logos/logo-without-fon-01 1.svg',
  'logo-without-fon-02': '/logos/logo-without-fon-02-04 1.svg',
};

export const Logo: FC<LogoProps> = ({
  variant = 'logo-without-fon-01',
  alt = 'Стильний Зубець Logo',
  width,
  height,
  className = '',
}) => {
  const src = logoFileMap[variant] || logoFileMap['logo-without-fon-01'];

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-contain ${className}`}
      loading="lazy"
    />
  );
};

export default Logo;
