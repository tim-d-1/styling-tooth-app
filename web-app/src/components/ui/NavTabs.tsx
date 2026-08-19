import type { FC } from 'react';
import Icon, { type IconName } from './Icon';

export type NavTabId = 'home' | 'booking' | 'pets' | 'account';

export interface NavTabItem {
  id: NavTabId;
  label: string;
  icon: IconName;
}

export interface NavTabsProps {
  activeTab?: NavTabId;
  onChange?: (tabId: NavTabId) => void;
  className?: string;
}

const TABS: NavTabItem[] = [
  { id: 'home', label: 'Головна', icon: 'fi-rr-home' },
  { id: 'booking', label: 'Запис', icon: 'fi-rr-calendar' },
  { id: 'pets', label: 'Улюбленці', icon: 'fi-rr-paw' },
  { id: 'account', label: 'Акаунт', icon: 'fi-rr-user' },
];

export const NavTabs: FC<NavTabsProps> = ({ activeTab = 'home', onChange, className = '' }) => {
  return (
    <div
      className={`ui-nav-tabs ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'var(--color-surface-white)',
        padding: '8px 16px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        width: '100%',
        maxWidth: '360px',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const color = isActive ? 'var(--color-interactive-primary)' : 'var(--color-content-primary)';

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '6px 12px',
              minWidth: '64px',
            }}
          >
            <Icon name={tab.icon} size={20} color={color} />
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-primary)',
                fontWeight: isActive ? 600 : 400,
                color,
              }}
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
