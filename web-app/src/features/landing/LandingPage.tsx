import { useState, useEffect, type FC } from 'react';
import Header from '@/components/layout/Header';
import LandingHero from './LandingHero';
import LandingAbout from './LandingAbout';
import LandingServices from './LandingServices';
import LandingContacts from './LandingContacts';
import LandingFooter from './LandingFooter';
import { scrollToSection } from '@/lib/section_navigation';
import { supabase } from '@/lib/supabase';

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
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(
    userAvatarUrl || null
  );
  const [profileName, setProfileName] = useState<string>(
    userName || 'Користувач'
  );

  useEffect(() => {
    if (userAvatarUrl) {
      setProfileAvatarUrl(userAvatarUrl);
    }
  }, [userAvatarUrl]);

  useEffect(() => {
    if (userName) {
      setProfileName(userName);
    }
  }, [userName]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let isMounted = true;
    async function loadUserProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user || !isMounted) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted) {
          const userMeta = user.user_metadata;
          const fullName =
            profile?.full_name ||
            userMeta?.full_name ||
            userMeta?.name ||
            userName ||
            'Користувач';
          setProfileName(fullName.split(' ')[0] || fullName);

          const avatar =
            profile?.avatar_url ||
            userMeta?.avatar_url ||
            userMeta?.picture ||
            userAvatarUrl ||
            null;
          if (avatar) {
            setProfileAvatarUrl(avatar);
          }
        }
      } catch {
        void 0;
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, userName, userAvatarUrl]);

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
        userName={profileName}
        userAvatarUrl={profileAvatarUrl || userAvatarUrl || '/assets/images/default-avatar.svg'}
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
