import type { FC } from 'react';
import Logo from './ui/Logo';
import Icon from './ui/Icon';

export interface HeaderProps {
  onNavClick?: (nav: string) => void;
  activeNav?: string;
  onProfileClick?: () => void;
  onDeviceClick?: () => void;
}

export const Header: FC<HeaderProps> = ({
  onNavClick,
  activeNav = 'home',
  onProfileClick,
  onDeviceClick,
}) => {
  const currentNav = activeNav?.trim() || 'home';

  const navItems = [
    { id: 'services', label: 'Послуги' },
    { id: 'about', label: 'Про нас' },
    { id: 'contacts', label: 'Контакти' },
  ];

  return (
    <header className="bg-white h-[72px] flex items-center justify-between px-8 shadow-xs sticky top-0 z-[100]">
      <button
        type="button"
        onClick={() => onNavClick?.('home')}
        aria-label="Головна сторінка"
        className="cursor-pointer flex items-center bg-transparent border-0 p-0 text-left hover:opacity-90 transition-opacity"
      >
        <Logo variant="mark-transparent" />
      </button>

      <nav className="flex items-center gap-10">
        {navItems.map((item) => {
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavClick?.(item.id)}
              aria-label={item.label}
              className={`bg-transparent border-0 font-accented text-base transition-colors duration-150 py-2 cursor-pointer ${
                isActive ? 'font-bold text-terracotta' : 'font-medium text-content-dark hover:text-terracotta'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onDeviceClick}
          aria-label="Завантажити мобільний застосунок"
          className="w-10 h-10 rounded-full bg-visit-gray border-0 flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-gray-200"
        >
          <Icon name="fi-rr-mobile" size={20} color="var(--color-content-primary)" />
        </button>

        <button
          type="button"
          onClick={onProfileClick}
          aria-label="Особистий профіль користувача"
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-terracotta p-0 cursor-pointer bg-visit-gray hover:opacity-90 transition-opacity"
        >
          <img
            src="/assets/images/cat_photo_1.png"
            alt="Аватар користувача"
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
