import type { FC } from 'react';
import Logo from '@/components/ui/Logo';
import Icon from '@/components/ui/Icon';
import { useStaffAuth } from '@/features/auth/StaffAuthProvider';

export interface StaffHeaderProps {
  activeTab: 'requests' | 'support';
  onNavigateTab: (tab: 'requests' | 'support') => void;
  onLogout: () => void;
  clientAppUrl?: string;
}

export const StaffHeader: FC<StaffHeaderProps> = ({
  activeTab,
  onNavigateTab,
  onLogout,
}) => {
  const { user } = useStaffAuth();

  return (
    <header className="bg-white min-h-[4.5rem] flex items-center justify-between px-6 sm:px-8 py-3 shadow-xs sticky top-0 z-[100] border-b border-gray-100">
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="flex items-center gap-3">
          <Logo variant="mark-transparent" height={38} />
          <div className="hidden sm:flex flex-col">
            <span className="font-accented font-bold text-sm text-content-dark leading-tight">
              Стильний Зубець
            </span>
            <span className="font-primary text-[11px] font-semibold text-terracotta tracking-wider uppercase">
              Staff Portal
            </span>
          </div>
        </div>

        <nav aria-label="Панель навігації персоналу" className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab('requests')}
            aria-current={activeTab === 'requests' ? 'page' : undefined}
            className={[
              'px-4 py-2 rounded-xl font-accented text-xs sm:text-sm font-semibold transition-all cursor-pointer border-0 outline-none flex items-center gap-2',
              activeTab === 'requests'
                ? 'bg-soft-blue text-white shadow-xs'
                : 'bg-transparent text-content-dark hover:bg-gray-100',
            ].join(' ')}
          >
            <Icon name="fi-rr-apps" size={16} />
            <span>Заявки</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('support')}
            aria-current={activeTab === 'support' ? 'page' : undefined}
            className={[
              'px-4 py-2 rounded-xl font-accented text-xs sm:text-sm font-semibold transition-all cursor-pointer border-0 outline-none flex items-center gap-2',
              activeTab === 'support'
                ? 'bg-soft-blue text-white shadow-xs'
                : 'bg-transparent text-content-dark hover:bg-gray-100',
            ].join(' ')}
          >
            <Icon name="fi-rr-headset" size={16} />
            <span>Підтримка</span>
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="font-primary font-semibold text-xs text-content-dark">
            {user?.fullName || user?.email || 'Співробітник'}
          </span>
          <span className="font-primary text-[10px] text-gray-400">
            {user?.email}
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Вийти"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-content-dark text-xs font-semibold cursor-pointer border-0 outline-none transition-colors"
        >
          <Icon name="fi-rr-sign-out-alt" size={14} />
          <span className="hidden sm:inline">Вийти</span>
        </button>
      </div>
    </header>
  );
};

export default StaffHeader;
