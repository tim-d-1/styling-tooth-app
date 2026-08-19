import type { FC } from 'react';
import Icon from './ui/Icon';
import NotificationBell from './ui/NotificationBell';

interface LocationBarProps {
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem 0.5rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Location Pin */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-content-primary)',
          fontSize: '0.9375rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Icon name="fi-rr-marker" size={18} color="var(--color-content-primary)" />
        <span>{location}</span>
      </div>

      {/* Notification Bell */}
      <NotificationBell hasBadge={hasNotification} onClick={onNotificationClick} />
    </div>
  );
};

export default LocationBar;
