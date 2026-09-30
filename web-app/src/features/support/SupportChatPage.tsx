import { useState, useEffect, useRef, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import TicketSidebarContext from './components/TicketSidebarContext';
import * as supportStore from './support_store';
import type { SupportTicket } from './support_types';
import { supabase } from '@/lib/supabase';
import { useSupportRealtime } from './use_support_realtime';

export interface SupportChatPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onCallClick?: (ticketId?: string) => void;
  onCreateTicketClick?: () => void;
  onToast?: (msg: string) => void;
  initialTicketId?: string;
  initialTickets?: SupportTicket[];
}

const QUICK_ACTIONS = [
  '📋 Перенести візит',
  '🌿 Спа-маска',
  '🧴 Уточнити щодо косметики',
  '❓ Правила скасування',
];

export const SupportChatPage: FC<SupportChatPageProps> = ({
  onHomeClick,
  onProfileClick,
  onCallClick,
  onCreateTicketClick,
  onToast,
  initialTicketId,
  initialTickets,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTicketId = searchParams.get('ticketId') || initialTicketId;

  const [userName, setUserName] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets || []);
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(() => {
    if (initialTickets && initialTickets.length > 0) {
      const matched = queryTicketId
        ? initialTickets.find((t) => t.id === queryTicketId)
        : initialTickets[0];
      return matched || initialTickets[0];
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!initialTickets);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  useSupportRealtime(currentTicket?.id, (msg) => {
    setCurrentTicket((prev) => {
      if (!prev) return prev;
      if (prev.messages.some((m) => m.id === msg.id)) return prev;
      return { ...prev, messages: [...prev.messages, msg] };
    });
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string) => {
    if (onToast) {
      onToast(message);
    }
  };

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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

        if (!initialTickets) {
          const loadedTickets = await supportStore.getTickets();
          if (isMounted) {
            setTickets(loadedTickets);
            if (loadedTickets.length > 0) {
              const matched = queryTicketId
                ? loadedTickets.find((t) => t.id === queryTicketId)
                : loadedTickets[0];
              setCurrentTicket(matched || loadedTickets[0]);
            } else {
              setCurrentTicket(null);
            }
          }
        } else if (initialTickets.length > 0 && isMounted) {
          const matched = queryTicketId
            ? initialTickets.find((t) => t.id === queryTicketId)
            : initialTickets[0];
          setCurrentTicket(matched || initialTickets[0]);
        }
      } catch {
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [queryTicketId, initialTickets]);

  useEffect(() => {
    scrollToBottom();
  }, [currentTicket?.messages]);

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

  const handleCreateTicketClick = () => {
    if (onCreateTicketClick) {
      onCreateTicketClick();
    } else {
      navigate('/support/new-ticket');
    }
  };

  const handleCallClick = () => {
    if (onCallClick) {
      onCallClick(currentTicket?.id);
    } else if (currentTicket) {
      navigate(`/support/call?ticketId=${currentTicket.id}`);
    } else {
      navigate('/support/call');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (
      typeof textToSend === 'string'
        ? textToSend
        : messageInput || textInputRef.current?.value || ''
    ).trim();
    if (!text && !attachedFile) return;
    if (!currentTicket) return;

    setIsSending(true);

    try {
      await supportStore.sendMessage(
        currentTicket.id,
        text,
        attachedFile || undefined
      );
      setMessageInput('');
      setAttachedFile(null);

      const refreshed = await supportStore.getTickets();
      if (refreshed && refreshed.length > 0) {
        setTickets(refreshed);
        const updated = refreshed.find((t) => t.id === currentTicket.id);
        if (updated) {
          setCurrentTicket(updated);
        }
      }
    } catch {
      showToast('Не вдалося надіслати повідомлення');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      showToast(`Прикріплено файл: ${file.name}`);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
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

        {!isLoading && tickets.length === 0 ? (
          <div className="w-full max-w-[42rem] mx-auto my-12 bg-white rounded-3xl p-8 sm:p-12 text-center shadow-xs border border-visit-gray/60 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center">
              <Icon name="fi-rr-headset" size={36} />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-accented font-bold text-2xl sm:text-3xl text-content-dark">
                У вас ще немає звернень
              </h1>
              <p className="font-primary text-sm text-content-dark/70 max-w-[28rem]">
                Маєте запитання щодо візиту, стану улюбленця або потрібна допомога? Створіть нове звернення, і старший адміністратор допоможе вам.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateTicketClick}
              className="px-8 shadow-sm"
            >
              Створити звернення
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <TicketSidebarContext ticket={currentTicket} />

            <section
              aria-label="Чат підтримки"
              className="w-full lg:w-[49.5625rem] bg-white rounded-3xl border border-visit-gray/60 shadow-xs flex flex-col h-[44rem] overflow-hidden"
            >
              <header className="p-4 sm:p-5 border-b border-visit-gray/60 flex items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="/assets/images/expert_advice_logo.png"
                      alt="Сергій"
                      className="w-12 h-12 rounded-full object-cover border border-visit-gray"
                    />
                    <span
                      aria-label="В мережі"
                      className="w-3.5 h-3.5 rounded-full bg-[#34C759] border-2 border-white absolute bottom-0 right-0"
                    />
                  </div>

                  <div className="flex flex-col">
                    <h2 className="font-accented font-bold text-base text-content-dark">
                      Сергій
                    </h2>
                    <span className="font-primary text-xs text-content-dark/60">
                      Старший адміністратор
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCallClick}
                    aria-label="Зателефонувати в підтримку"
                    className="w-11 h-11 rounded-full bg-surface-cream hover:bg-terracotta/10 text-terracotta flex items-center justify-center transition-colors cursor-pointer border border-visit-gray"
                  >
                    <Icon name="fi-rr-phone-call" size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateTicketClick}
                    aria-label="Нове звернення"
                    className="h-11 px-4 rounded-full bg-visit-gray hover:bg-visit-gray/80 text-content-dark font-medium text-xs hidden sm:flex items-center gap-2 transition-colors cursor-pointer border-0"
                  >
                    <Icon name="fi-rr-plus" size={14} />
                    <span>Нове звернення</span>
                  </button>
                </div>
              </header>

              <div className="px-4 py-2.5 bg-surface-cream/50 border-b border-visit-gray/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {QUICK_ACTIONS.map((actionText) => (
                  <button
                    key={actionText}
                    type="button"
                    onClick={() => handleSendMessage(actionText)}
                    className="shrink-0 bg-white hover:bg-terracotta hover:text-white text-content-dark text-xs font-medium px-3.5 py-1.5 rounded-full border border-visit-gray transition-colors cursor-pointer shadow-2xs"
                  >
                    {actionText}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-surface-cream/20">
                <div className="flex items-center justify-center my-1">
                  <span className="bg-visit-gray/70 text-content-dark/60 text-[11px] font-medium px-3 py-1 rounded-full">
                    Сьогодні, 10:30
                  </span>
                </div>

                {currentTicket?.messages.map((message) => {
                  const isAdmin = message.senderRole === 'staff';
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAdmin && (
                        <img
                          src="/assets/images/expert_advice_logo.png"
                          alt="Адміністратор Сергій"
                          className="w-9 h-9 rounded-full object-cover border border-visit-gray shrink-0 self-end"
                        />
                      )}

                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 shadow-2xs ${
                          isAdmin
                            ? 'bg-white text-content-dark rounded-bl-xs border border-visit-gray/60'
                            : 'bg-terracotta text-white rounded-br-xs'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.text}
                        </p>

                        {message.attachmentUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden max-h-48 border border-black/10">
                            <img
                              src={message.attachmentUrl}
                              alt="Вкладення"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}

                        <span
                          className={`block text-[10px] text-right mt-1.5 ${
                            isAdmin ? 'text-content-dark/40' : 'text-white/70'
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {attachedFile && (
                <div className="px-4 py-2 bg-visit-gray/50 border-t border-visit-gray/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      name="fi-rr-clip"
                      size={14}
                      className="text-terracotta"
                    />
                    <span className="text-xs font-medium text-content-dark truncate">
                      {attachedFile.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    aria-label="Видалити прикріплений файл"
                    className="p-1 hover:text-status-error text-content-dark/60 cursor-pointer border-0 bg-transparent"
                  >
                    <Icon name="fi-rr-cross-small" size={14} />
                  </button>
                </div>
              )}

              <footer className="p-3 sm:p-4 bg-white border-t border-visit-gray/60">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2 bg-surface-cream rounded-2xl px-3 py-2 border border-visit-gray focus-within:border-terracotta transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Додати файл або фото"
                    className="p-2 text-content-dark/60 hover:text-terracotta transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center shrink-0"
                  >
                    <Icon name="fi-rr-clip" size={18} />
                  </button>

                  <input
                    ref={textInputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Напишіть повідомлення..."
                    className="flex-1 bg-transparent border-0 outline-none text-sm text-content-dark placeholder:text-content-dark/40 font-primary"
                  />

                  <button
                    type="submit"
                    onClick={() => handleSendMessage()}
                    disabled={isSending}
                    aria-label="Надіслати повідомлення"
                    className={`w-10 h-10 rounded-full bg-terracotta hover:bg-terracotta-hover text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isSending || (!messageInput.trim() && !attachedFile)
                        ? 'opacity-40'
                        : ''
                    }`}
                  >
                    <Icon name="fi-rr-paper-plane" size={16} />
                  </button>
                </form>
              </footer>
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SupportChatPage;
