import type { FC } from 'react';
import Icon from './Icon';

export interface NotificationBellProps {
  hasBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: FC<NotificationBellProps> = ({
  hasBadge = true,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'ui-notification-bell relative w-10 h-10 rounded-full bg-white border border-visit-gray flex items-center justify-center cursor-pointer shadow-subtle hover:bg-visit-gray transition-colors outline-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={hasBadge ? 'Центр сповіщень: є нові сповіщення' : 'Центр сповіщень'}
    >
      <Icon name="fi-rr-bell" size={20} color="var(--color-content-primary)" />
      {hasBadge && (
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-terracotta"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export default NotificationBell;
