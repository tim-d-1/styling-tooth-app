import type { FC } from 'react';
import Button from './ui/Button';

export interface GuestBannerProps {
  onQuickBookClick?: () => void;
  className?: string;
}

export const GuestBanner: FC<GuestBannerProps> = ({
  onQuickBookClick,
  className,
}) => {
  return (
    <section className={['max-w-[1200px] mx-auto my-6 px-6 sm:px-8 mb-10', className].filter(Boolean).join(' ')}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-banner-brown-start via-banner-brown-mid to-banner-brown-end min-h-[14rem] md:min-h-[15rem] h-auto flex items-center p-8 md:p-12 shadow-md">
        <img
          src="/assets/images/dog_towel_shampoo.png"
          alt=""
          className="absolute right-0 top-0 h-full w-auto max-w-[65%] md:max-w-[55%] object-cover object-right pointer-events-none select-none z-10"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-banner-brown-start via-banner-brown-start/85 via-40% to-transparent z-20 pointer-events-none" />

        <div className="relative z-30 flex flex-col items-start max-w-md">
          <h2 className="text-3xl md:text-4xl font-bold font-accented text-white leading-tight m-0">
            Заплануйте<br />свій візит
          </h2>

          <Button
            variant="primary"
            size="md"
            onClick={onQuickBookClick}
            aria-label="Швидкий запис на візит"
            className="bg-terracotta rounded-xl shadow-xs hover:bg-terracotta-hover transition-colors px-6 py-2.5 mt-5 text-white font-accented font-semibold"
          >
            Швидкий запис
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GuestBanner;
