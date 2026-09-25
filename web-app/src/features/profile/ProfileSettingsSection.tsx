import type { FC } from 'react';
import Icon from '@/components/ui/Icon';
import type { SettingCardItem } from './profile_types';

const DEFAULT_SETTINGS: SettingCardItem[] = [
  {
    id: 'personal_info',
    title: 'Особисті дані',
    subtitle: "Ім'я, телефон, email",
    iconName: 'fi-rr-comment-user',
  },
  {
    id: 'addresses',
    title: 'Мої адреси',
    subtitle: 'Дім, Офіс',
    iconName: 'fi-rr-map-marker',
  },
  {
    id: 'payment_methods',
    title: 'Способи оплати',
    subtitle: 'Apple Pay, *4821',
    iconName: 'fi-rr-credit-card',
  },
  {
    id: 'notifications',
    title: 'Налаштування сповіщень',
    iconName: 'fi-rr-bell-ring',
  },
  {
    id: 'support',
    title: 'Підтримка',
    subtitle: 'Online',
    iconName: 'fi-rr-comments',
    isOnline: true,
  },
  {
    id: 'faq',
    title: 'Часті запитання (FAQ)',
    iconName: 'fi-rr-interrogation',
  },
];

export interface ProfileSettingsSectionProps {
  settings?: SettingCardItem[];
  onSelectSetting?: (settingId: string) => void;
}

export const ProfileSettingsSection: FC<ProfileSettingsSectionProps> = ({
  settings = DEFAULT_SETTINGS,
  onSelectSetting,
}) => {
  return (
    <section aria-labelledby="profile-settings-heading" className="w-full flex flex-col gap-6">
      <h2
        id="profile-settings-heading"
        className="font-accented font-bold text-xl md:text-2xl text-content-dark"
      >
        Налаштування профілю
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settings.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSetting?.(item.id)}
            className="w-full min-h-[5.3125rem] bg-white hover:bg-gray-50/80 rounded-2xl p-4 shadow-sm border border-black/5 flex items-center gap-3 text-left transition-all hover:shadow-md cursor-pointer outline-none"
          >
            <div className="relative w-10 h-10 rounded-full bg-[#ECEEF1] flex items-center justify-center shrink-0 text-content-dark">
              <Icon name={item.iconName} size={20} />
              {item.isOnline && (
                <span
                  data-testid="support-online-badge"
                  className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-white"
                />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-primary font-medium text-base text-content-dark truncate">
                {item.title}
              </span>
              {item.subtitle && (
                <span
                  className={[
                    'font-primary text-xs truncate',
                    item.isOnline ? 'text-[#34C759] font-medium' : 'text-content-dark/70',
                  ].join(' ')}
                >
                  {item.subtitle}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ProfileSettingsSection;
