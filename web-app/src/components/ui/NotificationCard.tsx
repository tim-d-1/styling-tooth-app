import type { FC, ReactNode } from 'react';
import Button from './Button';
import Icon from './Icon';

export interface NotificationCardProps {
  title: string;
  message: string;
  timeAgo?: string;
  unread?: boolean;
  read?: boolean;
  compact?: boolean;
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
  compact = false,
  icon,
  onMarkRead,
  className = '',
}) => {
  return (
    <div className={`ui-notification-card ${className}`}>
      <div className="ui-notification-card__header">
        <div className="ui-notification-card__avatar">
          {icon || <Icon name="fi-rr-bug" size={20} color="var(--color-content-primary)" />}
        </div>

        <div className="ui-notification-card__content">
          <div className="ui-notification-card__top">
            <h4 className="ui-notification-card__title">{title}</h4>
            {unread && !read && <span className="ui-notification-card__badge" />}
          </div>
          <p className="ui-notification-card__message">{message}</p>
          {timeAgo && <span className="ui-notification-card__time">{timeAgo}</span>}
        </div>
      </div>

      {!compact && (
        <Button
          variant={read ? 'primary' : 'secondary'}
          size="md"
          fullWidth
          onClick={onMarkRead}
          rightIcon={read ? <Icon name="fi-rr-check" size={14} color="#FFFFFF" /> : undefined}
        >
          {read ? 'Прочитано' : 'Позначити прочитаним'}
        </Button>
      )}
    </div>
  );
};

export default NotificationCard;
