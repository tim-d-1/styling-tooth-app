import type { FC } from 'react';
import Icon, { type IconName } from './Icon';

export type NavTabId = 'home' | 'booking' | 'pets' | 'account' | string;

export interface NavTabItem {
  id: NavTabId;
  label: string;
  icon: IconName;
}

export interface NavTabsProps {
  tabs?: NavTabItem[];
  activeTab?: NavTabId;
  onChange?: (tabId: NavTabId) => void;
  className?: string;
}

export const NavTabs: FC<NavTabsProps> = ({
  tabs = [],
  activeTab = 'home',
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`ui-nav-tabs flex items-center justify-around bg-white px-4 py-2 rounded-xl shadow-card w-full max-w-[360px] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const color = isActive ? 'var(--color-terracotta)' : 'var(--color-content-dark)';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className="flex flex-col items-center justify-center gap-1 border-0 bg-transparent cursor-pointer py-1.5 px-3 min-w-[64px] hover:opacity-80 transition-opacity"
          >
            <Icon name={tab.icon} size={20} color={color} />
            <span
              className={`text-[11px] font-primary transition-colors ${
                isActive ? 'font-semibold text-terracotta' : 'font-normal text-content-dark'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default NavTabs;
