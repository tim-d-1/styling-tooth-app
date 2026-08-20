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
  const effectiveName = name?.trim() || 'Катерина Ковальчук';
  const effectiveRoleLabel = roleLabel?.trim() || "Ім'я та Прізвище";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Профіль користувача: ${effectiveName}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`ui-user-profile-card flex items-center gap-3 p-4 rounded-xl w-full max-w-[342px] cursor-pointer transition-colors text-left ${
        isSelected
          ? 'bg-visit-gray border border-soft-blue'
          : 'bg-transparent border border-transparent hover:bg-visit-gray/50'
      } ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0">
        <Icon name="fi-rr-user" size={20} color="var(--color-content-primary)" />
      </div>

      <div className="flex flex-col flex-1 gap-0.5">
        <span className="text-xs text-gray-500 font-primary">
          {effectiveRoleLabel}
        </span>
        <span className="text-base font-medium text-content-dark font-primary">
          {effectiveName}
        </span>
      </div>

      <button
        type="button"
        aria-label={`Редагувати профіль ${effectiveName}`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.();
        }}
        className="bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center text-content-dark hover:opacity-80 transition-opacity"
      >
        <Icon name="fi-rr-pencil" size={18} color="var(--color-content-primary)" />
      </button>
    </div>
  );
};

export default UserProfileCard;
