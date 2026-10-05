import { useState, useEffect, type FC } from 'react';
import Header from '@/components/layout/Header';
import LandingHero from './LandingHero';
import LandingAbout from './LandingAbout';
import LandingServices from './LandingServices';
import LandingContacts from './LandingContacts';
import LandingFooter from './LandingFooter';
import { scrollToSection } from '@/lib/section_navigation';

export interface LandingPageProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onBookClick?: () => void;
  onQuickBookClick?: () => void;
  isLoggedIn?: boolean;
  onNavClick?: (nav: string) => void;
  onProfileClick?: () => void;
  onHomeClick?: () => void;
  userName?: string;
  userAvatarUrl?: string;
}

export const LandingPage: FC<LandingPageProps> = ({
  onRegisterClick,
  onLoginClick,
  onBookClick,
  onQuickBookClick,
  isLoggedIn = false,
  onNavClick,
  onProfileClick,
  onHomeClick,
  userName,
  userAvatarUrl,
}) => {
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace('#', '');
      if (hash && ['services', 'about', 'contacts'].includes(hash)) {
        setActiveNav(hash);
        setTimeout(() => {
          scrollToSection(hash);
        }, 50);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    if (nav === 'home') {
      if (isLoggedIn && onHomeClick) {
        onHomeClick();
      } else {
        scrollToSection('home');
        if (typeof window !== 'undefined') {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {
            void 0;
          }
        }
      }
      onNavClick?.(nav);
      return;
    }

    const scrolled = scrollToSection(nav);
    if (scrolled && typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', `#${nav}`);
      } catch {
        void 0;
      }
    }
    onNavClick?.(nav);
  };

  return (
    <div className="min-h-screen bg-landing-page text-content-dark font-primary flex flex-col">
      <Header
        isLoggedIn={isLoggedIn}
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onProfileClick={onProfileClick}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        activeNav={activeNav}
        onNavClick={handleNavClick}
      />
      <LandingHero
        onRegisterClick={onRegisterClick}
        onLoginClick={onLoginClick}
      />
      <LandingAbout onBookClick={onBookClick} />
      <LandingServices onQuickBookClick={onQuickBookClick || onBookClick} />
      <LandingContacts />
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
