import type { FC } from 'react';
import Icon from './Icon';

export interface UserProfileCardProps {
  name?: string;
  roleLabel?: string;
  isSelected?: boolean;
  onEdit?: () => void;
  onClick?: () => void;
  className?: string;
}

export const UserProfileCard: FC<UserProfileCardProps> = ({
  name = 'Катерина Ковальчук',
  roleLabel = "Ім'я та Прізвище",
  isSelected = false,
  onEdit,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`ui-user-profile-card ${className}`}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 8px',
        borderRadius: '12px',
        backgroundColor: isSelected ? 'var(--color-interactive-lightgray)' : 'transparent',
        border: isSelected ? '1px solid var(--color-surface-accent)' : '1px solid transparent',
        width: '100%',
        maxWidth: '342px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '9999px',
          backgroundColor: 'var(--color-interactive-lightgray)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name="fi-rr-user" size={20} color="var(--color-content-primary)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '2px' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-primary)' }}>
          {roleLabel}
        </span>
        <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-content-primary)', fontFamily: 'var(--font-primary)' }}>
          {name}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="fi-rr-pencil" size={18} color="var(--color-content-primary)" />
      </button>
    </div>
  );
};

export default UserProfileCard;
