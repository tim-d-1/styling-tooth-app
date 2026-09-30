import { useState, useEffect, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import TicketSidebarContext from './components/TicketSidebarContext';
import { getTickets } from './support_store';
import type { SupportTicket } from './support_types';
import { supabase } from '@/lib/supabase';

export interface SupportCallPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onBackToChat?: (ticketId?: string) => void;
  onToast?: (msg: string) => void;
  initialTicketId?: string;
  initialTicket?: SupportTicket | null;
  initialElapsedSeconds?: number;
}

export const SupportCallPage: FC<SupportCallPageProps> = ({
  onHomeClick,
  onProfileClick,
  onBackToChat,
  onToast,
  initialTicketId,
  initialTicket,
  initialElapsedSeconds = 0,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTicketId = searchParams.get('ticketId') || initialTicketId;

  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [ticket, setTicket] = useState<SupportTicket | null>(
    initialTicket !== undefined ? initialTicket : null
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(true);

  const showToast = (message: string) => {
    if (onToast) {
      onToast(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        if (sessionUser && isMounted) {
          setIsLoggedIn(true);

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', sessionUser.id)
            .maybeSingle();

          const resolvedName =
            profile?.full_name?.trim() ||
            sessionUser.user_metadata?.first_name ||
            sessionUser.user_metadata?.full_name ||
            sessionUser.user_metadata?.name ||
            'Користувач';

          const rawAvatar =
            profile?.avatar_url ||
            sessionUser.user_metadata?.avatar_url ||
            sessionUser.user_metadata?.picture ||
            null;

          setUserName(resolvedName);
          if (rawAvatar && typeof rawAvatar === 'string') {
            setUserAvatarUrl(rawAvatar.trim());
          }
        }

        if (initialTicket === undefined) {
          const tickets = await getTickets();
          if (isMounted) {
            if (tickets.length > 0) {
              const matched = queryTicketId
                ? tickets.find((t) => t.id === queryTicketId)
                : tickets[0];
              setTicket(matched || tickets[0]);
            }
          }
        }
      } catch {}
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [queryTicketId, initialTicket]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  const handleNavigateToChat = () => {
    if (onBackToChat) {
      onBackToChat(ticket?.id);
    } else if (ticket?.id) {
      navigate(`/support/chat?ticketId=${ticket.id}`);
    } else {
      navigate('/support/chat');
    }
  };

  const handleHangup = () => {
    showToast('Дзвінок завершено');
    handleNavigateToChat();
  };

  const handleToggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    showToast(nextState ? 'Мікрофон вимкнено' : 'Мікрофон увімкнено');
  };

  const handleToggleVideo = () => {
    const nextState = !isVideoActive;
    setIsVideoActive(nextState);
    showToast(nextState ? 'Камеру увімкнено' : 'Камеру вимкнено');
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerActive((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-cream text-content-dark font-primary">
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        userAvatarUrl={userAvatarUrl || undefined}
        onProfileClick={handleProfileClick}
        onNavClick={(nav) => {
          if (nav === 'home') handleHomeClick();
        }}
      />

      <main className="flex-1 w-full max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <nav
          aria-label="Хлібні крихти"
          className="flex items-center gap-2 text-sm text-content-dark/60 font-medium"
        >
          <button
            type="button"
            onClick={handleHomeClick}
            className="hover:text-terracotta transition-colors cursor-pointer"
          >
            Головна
          </button>
          <Icon
            name="fi-rr-angle-small-right"
            size={12}
            className="text-text-muted"
          />
          <button
            type="button"
            onClick={handleProfileClick}
            className="hover:text-terracotta transition-colors cursor-pointer"
          >
            Особистий кабінет
          </button>
          <Icon
            name="fi-rr-angle-small-right"
            size={12}
            className="text-text-muted"
          />
          <span className="text-terracotta font-medium">Служба підтримки</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <TicketSidebarContext ticket={ticket} />

          <section
            aria-label="Дзвінок у підтримку"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(236, 100, 58, 1) 0%, rgba(36, 47, 53, 1) 100%)',
            }}
            className="w-full lg:w-[49.5625rem] min-h-[44rem] rounded-3xl p-6 sm:p-10 text-white flex flex-col justify-between shadow-lg relative overflow-hidden"
          >
            <header className="flex items-center justify-between gap-4 z-10">
              <button
                type="button"
                onClick={handleNavigateToChat}
                aria-label="Назад до чату"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border-0"
              >
                <Icon name="fi-rr-arrow-left" size={18} />
              </button>

              <div className="flex flex-col items-center">
                <span className="font-accented font-bold text-base sm:text-lg">
                  Служба підтримки
                </span>
                <span
                  data-testid="call-timer"
                  className="font-primary text-xs sm:text-sm text-white/80 font-medium tracking-wider"
                >
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleSpeaker}
                aria-label={isSpeakerActive ? 'Вимкнути звук' : 'Увімкнути звук'}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border-0"
              >
                <Icon
                  name={isSpeakerActive ? 'fi-rr-volume' : 'fi-rr-cross'}
                  size={18}
                />
              </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center my-8 z-10 text-center">
              <div className="relative">
                <img
                  src="/assets/images/expert_advice_logo.png"
                  alt="Сергій"
                  className="w-[6.5625rem] h-[6.5625rem] rounded-full object-cover border-4 border-white/25 shadow-2xl"
                />
                <span className="w-4 h-4 rounded-full bg-[#34C759] border-2 border-white absolute bottom-1 right-1" />
              </div>

              <h2 className="font-accented font-bold text-2xl sm:text-3xl text-white mt-4">
                Адміністратор Сергій
              </h2>
              <span className="font-primary text-sm text-white/80 mt-1">
                Салон «Стильний зубець» • HD Audio
              </span>

              <div
                aria-label="Еквалайзер"
                className="flex items-center gap-1.5 h-10 my-6"
              >
                {[12, 20, 32, 18, 28, 14, 26, 16, 30, 22, 14].map(
                  (heightPx, i) => (
                    <span
                      key={i}
                      className="w-1 bg-white/80 rounded-full animate-pulse"
                      style={{
                        height: `${heightPx}px`,
                        animationDelay: `${i * 120}ms`,
                      }}
                    />
                  )
                )}
              </div>
            </div>

            <footer className="flex flex-col items-center gap-6 z-10">
              <div className="flex items-center justify-center gap-6 sm:gap-10">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label="Мікрофон"
                  className="flex flex-col items-center gap-2 group cursor-pointer border-0 bg-transparent text-white"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isMuted
                        ? 'bg-[#FF383C] text-white shadow-md'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    <Icon
                      name={isMuted ? 'fi-rr-microphone' : 'fi-rr-microphone'}
                      size={22}
                    />
                  </div>
                  <span className="text-xs font-medium text-white/90">
                    {isMuted ? 'Увімк. мікрофон' : 'Мікрофон'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  aria-label="Камера"
                  className="flex flex-col items-center gap-2 group cursor-pointer border-0 bg-transparent text-white"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isVideoActive
                        ? 'bg-[#34C759] text-white shadow-md'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    <Icon name="fi-rr-video-camera" size={22} />
                  </div>
                  <span className="text-xs font-medium text-white/90">
                    Камера
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleNavigateToChat}
                  aria-label="Чат"
                  className="flex flex-col items-center gap-2 group cursor-pointer border-0 bg-transparent text-white"
                >
                  <div className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all">
                    <Icon name="fi-rr-comment-alt" size={22} />
                  </div>
                  <span className="text-xs font-medium text-white/90">
                    Чат
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleHangup}
                  aria-label="Завершити дзвінок"
                  className="w-[4.5rem] h-[4.5rem] rounded-full bg-[#FF383C] hover:bg-[#E03034] text-white flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer border-0"
                >
                  <Icon name="fi-rr-phone-call" size={26} className="transform rotate-135" />
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SupportCallPage;
