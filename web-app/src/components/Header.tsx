import type { FC } from 'react';
import Logo from './ui/Logo';
import Icon from './ui/Icon';
import Button from './ui/Button';

export interface HeaderProps {
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onNavClick?: (nav: string) => void;
  activeNav?: string;
  onProfileClick?: () => void;
  onDeviceClick?: () => void;
  onNotificationClick?: () => void;
  hasNotification?: boolean;
  userAvatarUrl?: string;
  userName?: string;
  className?: string;
}

export const Header: FC<HeaderProps> = ({
  isLoggedIn = false,
  onLoginClick,
  onRegisterClick,
  onNavClick,
  activeNav = 'home',
  onProfileClick,
  onDeviceClick,
  onNotificationClick,
  hasNotification = false,
  userAvatarUrl = '/assets/images/cat_photo_1.png',
  userName = 'Користувач',
  className,
}) => {
  const currentNav = activeNav?.trim() || 'home';

  const navItems = [
    { id: 'services', label: 'Послуги' },
    { id: 'about', label: 'Про нас' },
    { id: 'contacts', label: 'Контакти' },
  ];

  return (
    <header
      className={[
        'bg-white min-h-[4.5rem] h-auto flex flex-wrap items-center justify-between px-6 sm:px-8 py-3 shadow-xs sticky top-0 z-[100] gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        onClick={() => onNavClick?.('home')}
        aria-label="Головна сторінка"
        className="cursor-pointer flex items-center bg-transparent border-0 p-0 text-left hover:opacity-90 transition-opacity outline-none"
      >
        <Logo variant="mark-transparent" />
      </button>

      <nav aria-label="Головна навігація" className="flex items-center gap-6 sm:gap-10">
        {navItems.map((item) => {
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavClick?.(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'bg-transparent border-0 font-accented text-sm sm:text-base transition-colors duration-150 py-2 cursor-pointer outline-none',
                isActive ? 'font-bold text-terracotta' : 'font-medium text-content-dark hover:text-terracotta',
              ].join(' ')}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={onDeviceClick}
              aria-label="Завантажити мобільний застосунок"
              className="w-10 h-10 rounded-full bg-visit-gray border-0 flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-gray-200 outline-none"
            >
              <Icon name="fi-rr-mobile" size={20} color="var(--color-content-primary)" />
            </button>

            {onNotificationClick && (
              <button
                type="button"
                onClick={onNotificationClick}
                aria-label={hasNotification ? 'Сповіщення: є нові' : 'Сповіщення'}
                className="relative w-10 h-10 rounded-full bg-visit-gray border-0 flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-gray-200 outline-none"
              >
                <Icon name="fi-rr-bell" size={20} color="var(--color-content-primary)" />
                {hasNotification && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-terracotta" aria-hidden="true" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onProfileClick}
              aria-label={`Особистий профіль користувача: ${userName}`}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-terracotta p-0 cursor-pointer bg-visit-gray hover:opacity-90 transition-opacity outline-none"
            >
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onLoginClick}
              aria-label="Вхід / Реєстрація"
            >
              Вхід / Реєстрація
            </Button>
            {onRegisterClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegisterClick}
                aria-label="Зареєструватися"
              >
                Реєстрація
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
