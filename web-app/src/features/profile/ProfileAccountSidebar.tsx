import { useRef, type FC, type ChangeEvent } from 'react';
import Icon from '@/components/ui/Icon';

export interface ProfileAccountSidebarProps {
  activeTab: 'personal-data' | 'addresses' | 'payment-methods';
  userData: {
    fullName: string;
    avatarUrl?: string | null;
    isVip?: boolean;
  };
  onAvatarChange?: (file: File) => void;
  onPersonalDataClick?: () => void;
  onAddressesClick?: () => void;
  onPaymentMethodsClick?: () => void;
  onLogout?: () => void;
}

export const ProfileAccountSidebar: FC<ProfileAccountSidebarProps> = ({
  activeTab,
  userData,
  onAvatarChange,
  onPersonalDataClick,
  onAddressesClick,
  onPaymentMethodsClick,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
  };

  const firstName = userData.fullName.split(' ')[0] || userData.fullName || 'Користувач';

  return (
    <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
      <section
        aria-label="Картка користувача"
        className="bg-[#232a35] rounded-3xl p-6 text-white text-center flex flex-col items-center gap-4 shadow-sm"
      >
        <div className="relative w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#fbcfe8] to-[#f472b6] flex items-center justify-center">
          <img
            src={userData.avatarUrl || '/assets/images/default-avatar.svg'}
            alt={userData.fullName}
            className="w-full h-full object-cover rounded-full bg-slate-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/images/default-avatar.svg';
            }}
          />
          <button
            type="button"
            onClick={handleAvatarTrigger}
            aria-label="Змінити аватар"
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center cursor-pointer shadow-md transition-colors outline-none"
          >
            <Icon name="fi-rr-edit" size={16} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="font-accented font-bold text-2xl text-white">{firstName}</h2>

          {userData.isVip && (
            <span
              data-testid="vip-badge"
              className="bg-terracotta text-white text-xs font-accented font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs"
            >
              <span>★</span>
              <span>V.I.P Користувач</span>
            </span>
          )}
        </div>
      </section>

      <nav
        aria-label="Меню профілю"
        className="bg-white rounded-3xl p-4 shadow-sm border border-black/5 flex flex-col gap-1 w-full"
      >
        <button
          type="button"
          onClick={onPersonalDataClick}
          className={`w-full font-accented rounded-2xl p-3 flex items-center gap-3 cursor-pointer outline-none text-left transition-colors ${
            activeTab === 'personal-data'
              ? 'bg-soft-blue/10 text-terracotta font-semibold'
              : 'text-content-dark hover:bg-interactive-lightgray font-medium'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              activeTab === 'personal-data'
                ? 'bg-soft-blue/20 text-terracotta'
                : 'bg-interactive-lightgray text-content-dark'
            }`}
          >
            <Icon name="fi-rr-user" size={18} />
          </div>
          <span className="text-sm">Особисті дані</span>
        </button>

        <button
          type="button"
          onClick={onAddressesClick}
          className={`w-full font-accented rounded-2xl p-3 flex items-center gap-3 cursor-pointer outline-none text-left transition-colors ${
            activeTab === 'addresses'
              ? 'bg-soft-blue/10 text-terracotta font-semibold'
              : 'text-content-dark hover:bg-interactive-lightgray font-medium'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              activeTab === 'addresses'
                ? 'bg-soft-blue/20 text-terracotta'
                : 'bg-interactive-lightgray text-content-dark'
            }`}
          >
            <Icon name="fi-rr-marker" size={18} />
          </div>
          <span className="text-sm">Мої адреси</span>
        </button>

        <button
          type="button"
          onClick={onPaymentMethodsClick}
          className={`w-full font-accented rounded-2xl p-3 flex items-center gap-3 cursor-pointer outline-none text-left transition-colors ${
            activeTab === 'payment-methods'
              ? 'bg-soft-blue/10 text-terracotta font-semibold'
              : 'text-content-dark hover:bg-interactive-lightgray font-medium'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              activeTab === 'payment-methods'
                ? 'bg-soft-blue/20 text-terracotta'
                : 'bg-interactive-lightgray text-content-dark'
            }`}
          >
            <Icon name="fi-rr-credit-card" size={18} />
          </div>
          <span className="text-sm">Способи оплати</span>
        </button>

        <div className="border-t border-black/5 my-2" />

        <button
          type="button"
          onClick={onLogout}
          aria-label="Вийти з акаунту"
          className="w-full text-status-danger hover:bg-red-50 font-accented font-medium rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors outline-none text-left"
        >
          <div className="w-10 h-10 rounded-full bg-red-50 text-status-danger flex items-center justify-center shrink-0">
            <Icon name="fi-rr-sign-out-alt" size={18} />
          </div>
          <span className="text-sm">Вийти з акаунту</span>
        </button>
      </nav>
    </aside>
  );
};

export default ProfileAccountSidebar;
