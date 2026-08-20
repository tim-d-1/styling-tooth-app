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
  ariaLabel?: string;
}

export const NavTabs: FC<NavTabsProps> = ({
  tabs = [],
  activeTab = 'home',
  onChange,
  className,
  ariaLabel = 'Навігаційні вкладки',
}) => {
  const currentTab = activeTab?.trim() || 'home';

  if (tabs.length === 0) {
    return (
      <div className={['ui-nav-tabs-empty p-3 text-center text-xs text-gray-500 font-primary', className].filter(Boolean).join(' ')}>
        Немає пунктів навігації
      </div>
    );
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={['ui-nav-tabs flex items-center justify-around bg-white px-4 py-2 rounded-xl shadow-card w-full max-w-[360px]', className].filter(Boolean).join(' ')}
    >
      {tabs.map((tab, index) => {
        const tabId = tab.id || `nav-tab-${index}`;
        const isActive = tabId === currentTab;
        const color = isActive ? 'var(--color-terracotta)' : 'var(--color-content-dark)';

        return (
          <button
            key={tabId}
            type="button"
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange?.(tabId)}
            className="flex flex-col items-center justify-center gap-1 border-0 bg-transparent cursor-pointer py-1.5 px-3 min-w-[64px] hover:opacity-80 transition-opacity outline-none"
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
    </nav>
  );
};

export default NavTabs;
