import type { FC } from 'react';
import LandingHero from './LandingHero';
import LandingAbout from './LandingAbout';
import LandingServices from './LandingServices';
import LandingContacts from './LandingContacts';
import LandingFooter from './LandingFooter';

export interface LandingPageProps {
  onRegisterClick?: () => void;
  onLoginClick?: () => void;
  onBookClick?: () => void;
  onQuickBookClick?: () => void;
}

export const LandingPage: FC<LandingPageProps> = ({
  onRegisterClick,
  onLoginClick,
  onBookClick,
  onQuickBookClick,
}) => {
  return (
    <div className="min-h-screen bg-landing-page text-content-dark font-primary flex flex-col">
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
