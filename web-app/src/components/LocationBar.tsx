import type { FC } from 'react';
import Icon from './ui/Icon';
import NotificationBell from './ui/NotificationBell';

export interface LocationBarProps {
  location?: string;
  onLocationClick?: () => void;
  onNotificationClick?: () => void;
  hasNotification?: boolean;
  className?: string;
}

export const LocationBar: FC<LocationBarProps> = ({
  location = 'м. Запоріжжя',
  onLocationClick,
  onNotificationClick,
  hasNotification = true,
  className,
}) => {
  const effectiveLocation = location?.trim() || 'м. Запоріжжя';

  return (
    <div className={['flex items-center justify-between pt-5 pb-2 px-6 sm:px-8 max-w-[1200px] mx-auto', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={onLocationClick}
        aria-label={`Поточна локація: ${effectiveLocation}`}
        className="flex items-center gap-2 text-content-dark text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0 outline-none"
      >
        <Icon name="fi-rr-marker" size={18} color="var(--color-content-primary)" />
        <span>{effectiveLocation}</span>
      </button>

      <NotificationBell hasBadge={hasNotification} onClick={onNotificationClick} />
    </div>
  );
};

export default LocationBar;
