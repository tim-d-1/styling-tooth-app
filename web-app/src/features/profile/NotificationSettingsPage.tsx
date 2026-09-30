import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import SocialIcon from '@/components/ui/SocialIcon';
import Switch from '@/components/ui/Switch';
import { supabase } from '@/lib/supabase';
import {
  type NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notification_types';

export type { NotificationPreferences };

export interface NotificationSettingsPageProps {
  initialPreferences?: NotificationPreferences;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onToast?: (msg: string) => void;
}

export const NotificationSettingsPage: FC<NotificationSettingsPageProps> = ({
  initialPreferences,
  onHomeClick,
  onProfileClick,
  onToast,
}) => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    initialPreferences || DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      navigate('/main');
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user || !isMounted) return;

        setUserName(
          user.user_metadata?.full_name ||
          user.user_metadata?.first_name ||
          ''
        );
        setUserAvatarUrl(
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null
        );

        if (!initialPreferences) {
          const saved = user.user_metadata?.notification_preferences;
          if (saved && typeof saved === 'object') {
            setPreferences({
              channels: {
                ...DEFAULT_NOTIFICATION_PREFERENCES.channels,
                ...(saved.channels || {}),
              },
              types: {
                ...DEFAULT_NOTIFICATION_PREFERENCES.types,
                ...(saved.types || {}),
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to load notification preferences:', err);
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [initialPreferences]);

  const handleToggleChannel = async (
    key: keyof NotificationPreferences['channels'],
    value: boolean
  ) => {
    const previous = preferences;
    const updated: NotificationPreferences = {
      ...preferences,
      channels: {
        ...preferences.channels,
        [key]: value,
      },
    };
    setPreferences(updated);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { notification_preferences: updated },
      });
      if (error) {
        setPreferences(previous);
        showToast('Помилка збереження налаштувань');
        return;
      }
      showToast('Налаштування збережено');
    } catch {
      setPreferences(previous);
      showToast('Помилка збереження налаштувань');
    }
  };

  const handleToggleType = async (
    key: keyof NotificationPreferences['types'],
    value: boolean
  ) => {
    const previous = preferences;
    const updated: NotificationPreferences = {
      ...preferences,
      types: {
        ...preferences.types,
        [key]: value,
      },
    };
    setPreferences(updated);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { notification_preferences: updated },
      });
      if (error) {
        setPreferences(previous);
        showToast('Помилка збереження налаштувань');
        return;
      }
      showToast('Налаштування збережено');
    } catch {
      setPreferences(previous);
      showToast('Помилка збереження налаштувань');
    }
  };

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={true}
          activeNav="profile"
          onNavClick={(nav) => {
            if (nav === 'home') handleHomeClick();
          }}
          onProfileClick={handleProfileClick}
          onDeviceClick={() => showToast('Завантажити додаток')}
          onNotificationClick={() => showToast('Немає нових сповіщень')}
          userAvatarUrl={userAvatarUrl || '/assets/images/default-avatar.svg'}
          userName={userName || 'Користувач'}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-10">
          <header className="flex flex-col gap-4">
            <nav
              aria-label="Навігація хлібними крихтами"
              className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
            >
              <button
                type="button"
                onClick={handleHomeClick}
                className="hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
              >
                Головна
              </button>
              <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
              <button
                type="button"
                onClick={handleProfileClick}
                className="hover:text-content-dark transition-colors cursor-pointer bg-transparent border-0 p-0 outline-none"
              >
                Особистий кабінет
              </button>
              <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
              <span className="text-terracotta font-medium">Налаштування сповіщень</span>
            </nav>

            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Налаштування сповіщень
            </h1>
          </header>

          <div className="flex flex-col gap-10 w-full">
            <section aria-labelledby="channels-heading" className="flex flex-col gap-4 w-full">
              <h2
                id="channels-heading"
                className="font-accented font-bold text-xl md:text-2xl text-content-dark"
              >
                Канали зв'язку
              </h2>

              <div className="bg-white rounded-3xl p-6 shadow-card border border-black/5 flex flex-col gap-6 w-full">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-visit-gray">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0">
                      <SocialIcon platform="Telegram" colorScheme="Original" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-primary font-medium text-base text-content-dark">
                          Telegram
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-medium">
                          <Icon name="fi-rr-check" size={11} className="text-[#34C759]" />
                          <span>Підтверджено</span>
                        </span>
                      </div>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Отримувати повідомлення через Telegram бота
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.telegram}
                    onChange={(val) => handleToggleChannel('telegram', val)}
                    ariaLabel="Telegram"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pb-6 border-b border-visit-gray">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-bell-ring" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        Push-сповіщення
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Дозволити додатку надсилати вам важливі оновлення
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.push}
                    onChange={(val) => handleToggleChannel('push', val)}
                    ariaLabel="Push-сповіщення"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pb-6 border-b border-visit-gray">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-smartphone" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        SMS-повідомлення
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Текстові повідомлення на ваш номер телефону
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.sms}
                    onChange={(val) => handleToggleChannel('sms', val)}
                    ariaLabel="SMS-повідомлення"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-envelope" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        Email розсилка
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Листи на електронну пошту
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.channels.email}
                    onChange={(val) => handleToggleChannel('email', val)}
                    ariaLabel="Email розсилка"
                  />
                </div>
              </div>
            </section>

            <section aria-labelledby="types-heading" className="flex flex-col gap-4 w-full">
              <h2
                id="types-heading"
                className="font-accented font-bold text-xl md:text-2xl text-content-dark"
              >
                Типи сповіщень
              </h2>

              <div className="bg-white rounded-3xl p-6 shadow-card border border-black/5 flex flex-col gap-6 w-full">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-visit-gray">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-calendar" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        Нагадування про візити
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Сповіщення за 24 та 2 години до початку прийому
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.types.visits}
                    onChange={(val) => handleToggleType('visits', val)}
                    ariaLabel="Нагадування про візити"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pb-6 border-b border-visit-gray">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-exclamation" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        Нагадування про обробки
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Графік регулярної обробки від кліщів та паразитів
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.types.treatments}
                    onChange={(val) => handleToggleType('treatments', val)}
                    ariaLabel="Нагадування про обробки"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 pb-6 border-b border-visit-gray">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-label" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        Персональні акції та знижки
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Спеціальні пропозиції та подвійні бонуси
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.types.promos}
                    onChange={(val) => handleToggleType('promos', val)}
                    ariaLabel="Персональні акції та знижки"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-visit-gray flex items-center justify-center shrink-0 text-content-dark">
                      <Icon name="fi-rr-spa" size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-primary font-medium text-base text-content-dark">
                        Новинки СПА та догляду
                      </span>
                      <span className="font-primary text-xs sm:text-sm text-content-dark/70">
                        Інформація про нові процедури та косметику для улюбленця
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.types.newSpa}
                    onChange={(val) => handleToggleType('newSpa', val)}
                    ariaLabel="Новинки СПА та догляду"
                  />
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default NotificationSettingsPage;
