import type { FC } from 'react';
import Logo from './ui/Logo';
import Icon from './ui/Icon';

interface HeaderProps {
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
  const navItems = [
    { id: 'services', label: 'Послуги' },
    { id: 'about', label: 'Про нас' },
    { id: 'contacts', label: 'Контакти' },
  ];

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        boxShadow: 'var(--shadow-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        onClick={() => onNavClick?.('home')}
      >
        <Logo variant="logo-without-fon-01" height={44} />
      </div>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2.5rem',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavClick?.(item.id)}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-accented)',
                fontSize: '1rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-interactive-primary)' : 'var(--color-content-primary)',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
                padding: '0.5rem 0',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <button
          type="button"
          onClick={onDeviceClick}
          aria-label="App download QR"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-interactive-lightgray)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)',
          }}
        >
          <Icon name="fi-rr-mobile" size={20} color="var(--color-content-primary)" />
        </button>

        <button
          type="button"
          onClick={onProfileClick}
          aria-label="User Profile"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid var(--color-interactive-primary)',
            padding: 0,
            cursor: 'pointer',
            backgroundColor: 'var(--color-interactive-lightgray)',
          }}
        >
          <img
            src="/images/cat_photo_1.png"
            alt="User avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
