import { useState, useEffect, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import ProfileAccountSidebar from './ProfileAccountSidebar';
import type { SavedPaymentMethod, PaymentTransaction } from './profile_types';
import { formatAppointmentDate } from './profile_utils';
import { supabase } from '@/lib/supabase';

export interface PaymentMethodsPageProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onPersonalDataClick?: () => void;
  onAddressesClick?: () => void;
  onLogout?: () => void;
  onAddCard?: (card: SavedPaymentMethod) => void;
  onDownloadReceipt?: (transactionId: string) => void;
  onToast?: (message: string) => void;
  initialMethods?: SavedPaymentMethod[];
  initialTransactions?: PaymentTransaction[];
  initialUserData?: {
    fullName: string;
    avatarUrl?: string | null;
    isVip?: boolean;
  };
}

export const PaymentMethodsPage: FC<PaymentMethodsPageProps> = ({
  onHomeClick,
  onProfileClick,
  onPersonalDataClick,
  onAddressesClick,
  onLogout,
  onAddCard,
  onDownloadReceipt,
  onToast,
  initialMethods,
  initialTransactions,
  initialUserData,
}) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    fullName: initialUserData?.fullName || 'Користувач',
    avatarUrl: initialUserData?.avatarUrl ?? null,
    isVip: initialUserData?.isVip ?? false,
  });

  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>(
    initialMethods || []
  );
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(
    initialTransactions || []
  );

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(3);

  const showToast = (message: string) => {
    if (onToast && message) {
      onToast(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (!currentUserId || !isMounted) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!isMounted) return;

      const userMeta = sessionData?.session?.user?.user_metadata;
      const resolvedName = profile?.full_name || userMeta?.full_name || 'Користувач';
      const rawAvatar = profile?.avatar_url || userMeta?.avatar_url || userMeta?.picture || null;
      const resolvedAvatar =
        rawAvatar &&
        typeof rawAvatar === 'string' &&
        rawAvatar.trim() &&
        rawAvatar.trim() !== 'null' &&
        rawAvatar.trim() !== 'undefined'
          ? rawAvatar.trim()
          : null;

      setUserData({
        fullName: resolvedName,
        avatarUrl: resolvedAvatar,
        isVip: true,
      });

      if (userMeta?.payment_methods && !initialMethods) {
        setSavedMethods(userMeta.payment_methods);
      }

      if (!initialTransactions) {
        const payFrom = supabase.from('payments');
        if (typeof payFrom?.select === 'function') {
          let payQuery: any = payFrom.select(`
            id,
            amount,
            currency,
            status,
            provider,
            invoice_id,
            page_url,
            created_at,
            appointment:appointments(
              id,
              starts_at,
              pet:pets(name),
              service:services!appointments_service_id_fkey(name)
            )
          `);

          if (typeof payQuery?.eq === 'function') {
            payQuery = payQuery.eq('client_id', currentUserId);
            if (typeof payQuery?.order === 'function') {
              payQuery = payQuery.order('created_at', { ascending: false });
            }
          }

          const { data: dbPayments } = (await payQuery) || {};

          if (isMounted && dbPayments && dbPayments.length > 0) {
          const mapped: PaymentTransaction[] = dbPayments.map((p: any) => {
            const appt = Array.isArray(p.appointment) ? p.appointment[0] : p.appointment;
            const srv = Array.isArray(appt?.service) ? appt.service[0] : appt?.service;
            const pet = Array.isArray(appt?.pet) ? appt.pet[0] : appt?.pet;
            const title = srv?.name
              ? `${srv.name}${pet?.name ? ` (${pet.name})` : ''}`
              : `Оплата через ${p.provider || 'картку'}`;
            const dateFormatted = formatAppointmentDate(p.created_at || appt?.starts_at);
            const serviceType = srv?.name?.toLowerCase().includes('спа') ? 'spa' : 'grooming';

            return {
              id: p.id,
              title,
              dateFormatted,
              amount: Number(p.amount) || 0,
              currency: p.currency || 'UAH',
              serviceType,
              receiptUrl: p.page_url || undefined,
            };
          });
          setTransactions(mapped);
        }
      }
    }
  }

    if (!initialUserData || !initialTransactions) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [initialUserData, initialMethods, initialTransactions]);

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

  const handlePersonalDataClick = () => {
    if (onPersonalDataClick) {
      onPersonalDataClick();
    } else {
      navigate('/profile/personal-data');
    }
  };

  const handleAddressesClick = () => {
    if (onAddressesClick) {
      onAddressesClick();
    } else {
      navigate('/profile/addresses');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
    showToast('Ви вийшли з акаунту');
  };

  const handleAvatarChange = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setUserData((prev) => ({ ...prev, avatarUrl: previewUrl }));
    showToast('Аватар оновлено');
  };

  const formatCardNumber = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      return `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    return raw;
  };

  const handleSelectDefaultMethod = async (id: string) => {
    const updated = savedMethods.map((method) => ({
      ...method,
      isDefault: method.id === id,
    }));
    setSavedMethods(updated);

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      await supabase.auth.updateUser({
        data: { payment_methods: updated },
      });
    }
    showToast('Основний спосіб оплати оновлено');
  };

  const handleDeleteMethod = async (id: string) => {
    const updated = savedMethods.filter((method) => method.id !== id);
    setSavedMethods(updated);

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      await supabase.auth.updateUser({
        data: { payment_methods: updated },
      });
    }
    showToast('Спосіб оплати видалено');
  };

  const handleAddCardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const rawDigits = cardNumber.replace(/\D/g, '');
    if (rawDigits.length < 16) {
      showToast('Введіть коректний 16-значний номер картки');
      return;
    }
    if (expiry.length < 5) {
      showToast('Введіть термін дії у форматі MM/YY');
      return;
    }
    if (cvv.length < 3) {
      showToast('Введіть 3 цифри CVV/CVC');
      return;
    }

    setIsSubmitting(true);
    try {
      const last4 = rawDigits.slice(-4);
      const newCard: SavedPaymentMethod = {
        id: `pm-card-${Date.now()}`,
        type: 'card',
        title: `•••• ${last4}`,
        subtitle: `Термін: ${expiry}`,
        isDefault: saveCard && savedMethods.length === 0,
        last4,
        expiry,
      };

      const updated = [...savedMethods, newCard];
      setSavedMethods(updated);

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await supabase.auth.updateUser({
          data: { payment_methods: updated },
        });
      }

      if (onAddCard) {
        onAddCard(newCard);
      }

      setCardNumber('');
      setExpiry('');
      setCvv('');
      showToast('Картку успішно додано');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = (id: string) => {
    if (onDownloadReceipt) {
      onDownloadReceipt(id);
    }
    showToast('Чек завантажено');
  };

  const firstName = userData.fullName.split(' ')[0] || userData.fullName;

  return (
    <div className="min-h-screen bg-surface-cream text-content-dark font-primary flex flex-col justify-between">
      <div className="flex-1 pb-16">
        <Header
          isLoggedIn={true}
          activeNav="profile"
          onNavClick={(nav) => {
            if (nav === 'home') {
              handleHomeClick();
            } else if (nav === 'services' || nav === 'book') {
              navigate('/main');
            }
          }}
          onProfileClick={handleProfileClick}
          onDeviceClick={() => showToast('Завантажити додаток')}
          onNotificationClick={() => showToast('Немає нових сповіщень')}
          userAvatarUrl={userData.avatarUrl || '/assets/images/default-avatar.svg'}
          userName={firstName}
        />

        <main className="max-w-[75rem] mx-auto px-6 pt-10 flex flex-col gap-8">
          <nav
            aria-label="Навігація по сайту"
            className="flex items-center gap-2 text-xs md:text-sm font-primary text-text-muted flex-wrap"
          >
            <button
              type="button"
              onClick={handleHomeClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Головна
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <button
              type="button"
              onClick={handleProfileClick}
              className="hover:text-content-dark transition-colors cursor-pointer"
            >
              Особистий кабінет
            </button>
            <Icon name="fi-rr-angle-small-right" size={12} className="text-text-muted" />
            <span className="text-terracotta font-medium">Способи оплати</span>
          </nav>

          <header className="flex flex-col gap-2">
            <h1 className="font-accented font-bold text-3xl md:text-4xl text-content-dark">
              Способи оплати
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <ProfileAccountSidebar
              activeTab="payment-methods"
              userData={userData}
              onAvatarChange={handleAvatarChange}
              onPersonalDataClick={handlePersonalDataClick}
              onAddressesClick={handleAddressesClick}
              onPaymentMethodsClick={() => {}}
              onLogout={handleLogout}
            />

            <section
              aria-label="Секція способів оплати"
              className="lg:col-span-8 flex flex-col gap-6 w-full"
            >
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-4">
                <h2 className="font-accented font-bold text-2xl text-content-dark">
                  Збережені способи
                </h2>

                {savedMethods.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {savedMethods.map((method) => {
                      return (
                        <div
                          key={method.id}
                          data-testid={`payment-method-${method.id}`}
                          onClick={() => handleSelectDefaultMethod(method.id)}
                          className={`border rounded-2xl p-4.5 flex items-center justify-between cursor-pointer transition-colors ${
                            method.isDefault
                              ? 'border-terracotta/40 bg-soft-blue/5'
                              : 'border-black/10 hover:border-black/20 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-[#f4f7fb] border border-black/5 flex items-center justify-center shrink-0">
                              <Icon name="fi-rr-credit-card" size={20} className="text-content-dark" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-accented font-semibold text-base text-content-dark">
                                {method.title}
                              </span>
                              {method.subtitle && (
                                <span className="text-xs text-text-muted font-primary">
                                  {method.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMethod(method.id);
                              }}
                              aria-label={`Видалити картку ${method.title}`}
                              className="w-9 h-9 rounded-xl hover:bg-red-50 text-terracotta hover:text-red-700 flex items-center justify-center transition-colors cursor-pointer outline-none"
                            >
                              <Icon name="fi-rr-trash" size={16} />
                            </button>

                            <div
                              aria-label={method.isDefault ? 'Обрано основним' : 'Обрати основним'}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center p-0.5 transition-colors ${
                                method.isDefault
                                  ? 'border-terracotta'
                                  : 'border-black/20 hover:border-black/40'
                              }`}
                            >
                              {method.isDefault && (
                                <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div data-testid="no-saved-methods" className="py-6 text-center text-text-muted text-sm font-primary">
                    У вас ще немає збережених способів оплати
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-6">
                <h2 className="font-accented font-bold text-2xl text-content-dark">
                  Додати банківську картку
                </h2>

                <form onSubmit={handleAddCardSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="card-number" className="text-xs text-text-muted font-primary">
                      Номер картки
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="card-number"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="w-full border border-black/15 rounded-2xl pl-4 pr-12 py-3.5 text-base text-content-dark font-accented font-medium outline-none focus:border-terracotta transition-colors bg-[#fbfbfb]"
                      />
                      <div className="absolute right-4 text-text-muted pointer-events-none flex items-center justify-center">
                        <Icon name="fi-rr-credit-card" size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="card-expiry" className="text-xs text-text-muted font-primary">
                        Термін (MM/YY)
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="card-expiry"
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          className="w-full border border-black/15 rounded-2xl pl-4 pr-12 py-3.5 text-base text-content-dark font-accented font-medium outline-none focus:border-terracotta transition-colors bg-[#fbfbfb]"
                        />
                        <div className="absolute right-4 text-text-muted pointer-events-none flex items-center justify-center">
                          <Icon name="fi-rr-calendar" size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="card-cvv" className="text-xs text-text-muted font-primary">
                        CVV / CVC
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="card-cvv"
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          className="w-full border border-black/15 rounded-2xl pl-4 pr-12 py-3.5 text-base text-content-dark font-accented font-medium outline-none focus:border-terracotta transition-colors bg-[#fbfbfb]"
                        />
                        <div className="absolute right-4 text-text-muted pointer-events-none flex items-center justify-center">
                          <Icon name="fi-rr-lock" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-content-dark/60 text-terracotta accent-terracotta cursor-pointer"
                    />
                    <span className="text-sm text-content-dark font-primary">
                      Зберегти картку для швидкої оплати
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-terracotta hover:bg-terracotta-hover text-white font-accented font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none disabled:opacity-50 mt-1"
                  >
                    {isSubmitting ? 'Додавання...' : 'Додати картку'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-black/5 flex flex-col gap-5">
                <h2 className="font-accented font-bold text-2xl text-content-dark">
                  Останні транзакції
                </h2>

                {transactions.length > 0 ? (
                  <div className="flex flex-col divide-y divide-black/5">
                    {transactions.slice(0, historyLimit).map((tx) => {
                      const icon =
                        tx.serviceType === 'spa'
                          ? 'fi-rr-bath'
                          : tx.serviceType === 'grooming'
                            ? 'fi-rr-paw'
                            : 'fi-rr-scissors';

                      const iconColor =
                        tx.serviceType === 'spa'
                          ? 'bg-rose-50 text-terracotta'
                          : tx.serviceType === 'grooming'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-emerald-50 text-emerald-600';

                      return (
                        <div
                          key={tx.id}
                          data-testid={`transaction-${tx.id}`}
                          className="py-4.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconColor}`}
                            >
                              <Icon name={icon} size={18} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-accented font-semibold text-base text-content-dark truncate">
                                {tx.title}
                              </span>
                              <span className="text-xs text-text-muted font-primary">
                                {tx.dateFormatted}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 shrink-0 justify-between sm:justify-end w-full sm:w-auto">
                            <span className="font-accented font-bold text-base text-content-dark">
                              {tx.amount.toLocaleString('uk-UA')} {tx.currency || 'грн'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(tx.id)}
                              className="text-terracotta hover:text-terracotta-hover text-sm font-accented font-medium flex items-center gap-1.5 transition-colors cursor-pointer outline-none"
                            >
                              <Icon name="fi-rr-download" size={14} />
                              <span>Завантажити чек</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div data-testid="no-transactions" className="py-6 text-center text-text-muted text-sm font-primary">
                    Немає проведених транзакцій
                  </div>
                )}

                {transactions.length > historyLimit && (
                  <button
                    type="button"
                    onClick={() => setHistoryLimit((prev) => prev + 5)}
                    className="pt-2 text-text-muted hover:text-content-dark text-sm font-primary text-center transition-colors cursor-pointer outline-none"
                  >
                    Показати більше історії
                  </button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentMethodsPage;
