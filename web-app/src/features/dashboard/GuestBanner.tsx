import type { FC } from 'react';
import Button from '@/components/ui/Button';

export interface GuestBannerProps {
  onQuickBookClick?: () => void;
  className?: string;
}

export const GuestBanner: FC<GuestBannerProps> = ({
  onQuickBookClick,
  className,
}) => {
  return (
    <section className={['max-w-[75rem] mx-auto my-6 px-6 sm:px-8 mb-10', className].filter(Boolean).join(' ')}>
      <div className="relative overflow-hidden rounded-[10px] bg-[#161615] min-h-[20rem] md:min-h-[26.625rem] flex items-center p-8 sm:p-12 lg:p-[3.625rem_3.6875rem] shadow-md">
        <img
          src="/assets/images/dog_towel_shampoo.png"
          alt=""
          className="absolute right-0 top-0 h-full w-full sm:w-[50%] lg:w-[33.5625rem] object-cover object-center pointer-events-none select-none z-10"
        />

        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(230deg, rgba(20, 20, 19, 0) 0%, rgba(185, 83, 52, 1) 100%)',
          }}
        />

        <div className="relative z-30 flex flex-col items-start max-w-[22rem]">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-accented text-surface-cream leading-[1.15] m-0 max-w-[20.5rem]">
            Заплануйте свій візит
          </h2>

          <Button
            variant="primary"
            size="lg"
            onClick={onQuickBookClick}
            aria-label="Швидкий запис на візит"
            className="w-full max-w-[20.5rem] h-12 bg-terracotta hover:bg-terracotta-hover text-surface-cream font-accented font-semibold text-base rounded-xl transition-colors shadow-xs mt-8 lg:mt-10"
          >
            Швидкий запис
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GuestBanner;
