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
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ui-notification-bell ${className}`}
      aria-label="Notifications"
      style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-surface-white)',
        border: '1px solid var(--color-interactive-lightgray)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      <Icon name="fi-rr-bell" size={20} color="var(--color-content-primary)" />
      {hasBadge && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-interactive-primary)',
          }}
        />
      )}
    </button>
  );
};

export default NotificationBell;
