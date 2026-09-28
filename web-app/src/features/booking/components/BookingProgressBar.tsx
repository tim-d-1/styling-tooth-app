import type { FC } from 'react';

export interface BookingProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}

export const BookingProgressBar: FC<BookingProgressBarProps> = ({
  currentStep,
  totalSteps = 5,
  className = '',
}) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Крок ${currentStep} з ${totalSteps}`}
      className={`flex items-center justify-center gap-2 mt-8 sm:mt-12 ${className}`}
    >
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => {
        const isActive = stepNumber <= currentStep;
        return (
          <span
            key={stepNumber}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
              isActive ? 'bg-terracotta' : 'bg-[#ECEEF1]'
            }`}
          />
        );
      })}
    </div>
  );
};

export default BookingProgressBar;
