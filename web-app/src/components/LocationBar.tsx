import type { FC } from 'react';
import Icon from './ui/Icon';
import NotificationBell from './ui/NotificationBell';

export interface LocationBarProps {
  location?: string;
  onNotificationClick?: () => void;
  hasNotification?: boolean;
}

export const LocationBar: FC<LocationBarProps> = ({
  location = 'м. Запоріжжя',
  onNotificationClick,
  hasNotification = true,
}) => {
  return (
    <div className="flex items-center justify-between pt-5 pb-2 px-8 max-w-[1200px] mx-auto">
      <button
        type="button"
        aria-label={`Поточна локація: ${location}`}
        className="flex items-center gap-2 text-content-dark text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity bg-transparent border-0 p-0"
      >
        <Icon name="fi-rr-marker" size={18} color="var(--color-content-primary)" />
        <span>{location}</span>
      </button>

      <NotificationBell hasBadge={hasNotification} onClick={onNotificationClick} />
    </div>
  );
};

export default LocationBar;
