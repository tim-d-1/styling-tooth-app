import type { FC, ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import Icon from '@/components/ui/Icon';

export interface DetailCardLayoutProps {
  children: ReactNode;
  onBackClick?: () => void;
  className?: string;
  cardClassName?: string;
  maxWidth?: string;
  isLoggedIn?: boolean;
  userName?: string;
  userAvatarUrl?: string;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onProfileClick?: () => void;
  onNavClick?: (nav: string) => void;
  onDeviceClick?: () => void;
  onNotificationClick?: () => void;
  hasNotification?: boolean;
}

export const DetailCardLayout: FC<DetailCardLayoutProps> = ({
  children,
  onBackClick,
  className,
  cardClassName,
  maxWidth = 'max-w-[49.5rem]',
  isLoggedIn = false,
  userName,
  userAvatarUrl,
  onLoginClick,
  onRegisterClick,
  onProfileClick,
  onNavClick,
  onDeviceClick,
  onNotificationClick,
  hasNotification = false,
}) => {
  return (
    <div
      className={[
        'min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={isLoggedIn}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          onLoginClick={onLoginClick}
          onRegisterClick={onRegisterClick}
          onProfileClick={onProfileClick}
          onNavClick={onNavClick}
          onDeviceClick={onDeviceClick}
          onNotificationClick={onNotificationClick}
          hasNotification={hasNotification}
        />

        <div className="max-w-[75rem] mx-auto px-6 sm:px-8 pt-8">
          {onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              aria-label="Назад"
              className="mb-6 inline-flex items-center justify-center p-1 text-content-dark hover:opacity-80 transition-opacity cursor-pointer border-0 bg-transparent"
            >
              <Icon name="fi-rr-arrow-left" size={20} color="var(--color-content-primary)" />
            </button>
          )}

          <div className="w-full flex justify-center">
            <article
              className={[
                'w-full bg-white rounded-[10px] p-6 sm:py-14 sm:px-12 shadow-[0_4px_20px_0_rgba(36,47,53,0.06)]',
                maxWidth,
                cardClassName,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {children}
            </article>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DetailCardLayout;
