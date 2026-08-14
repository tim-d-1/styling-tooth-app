import type { FC, ReactNode } from 'react';
import Button from './Button';

export interface NotificationCardProps {
  title: string;
  message: string;
  timeAgo: string;
  unread?: boolean;
  read?: boolean;
  icon?: ReactNode;
  onMarkRead?: () => void;
  className?: string;
}

export const NotificationCard: FC<NotificationCardProps> = ({
  title,
  message,
  timeAgo,
  unread = true,
  read = false,
  icon,
  onMarkRead,
  className = '',
}) => {
  return (
    <div className={`ui-notification-card ${className}`}>
      {/* Top Header Row */}
      <div className="ui-notification-card__header">
        <div className="ui-notification-card__avatar">
          {icon || (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2C6.686 2 4 4.686 4 8V11.586L2.293 13.293C2.007 13.579 1.93 14.009 2.097 14.373C2.264 14.737 2.628 14.972 3.028 14.972H16.972C17.372 14.972 17.736 14.737 17.903 14.373C18.07 14.009 17.993 13.579 17.707 13.293L16 11.586V8C16 4.686 13.314 2 10 2Z"
                fill="var(--color-content-primary)"
              />
              <path
                d="M10 18C11.105 18 12 17.105 12 16H8C8 17.105 8.895 18 10 18Z"
                fill="var(--color-content-primary)"
              />
            </svg>
          )}
        </div>

        <div className="ui-notification-card__content">
          <div className="ui-notification-card__top">
            <h4 className="ui-notification-card__title">{title}</h4>
            {unread && <span className="ui-notification-card__badge" />}
          </div>
          <p className="ui-notification-card__message">{message}</p>
          <span className="ui-notification-card__time">{timeAgo}</span>
        </div>
      </div>

      {/* Button Action */}
      <Button
        variant={read ? 'secondary' : 'primary'}
        size="md"
        fullWidth
        onClick={onMarkRead}
      >
        {read ? 'Прочитано' : 'Позначити прочитаним'}
      </Button>
    </div>
  );
};

export default NotificationCard;
