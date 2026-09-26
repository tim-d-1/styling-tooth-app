import { useState, useEffect, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import ProfileAccountSidebar from './ProfileAccountSidebar';
import type { SavedPaymentMethod, PaymentTransaction } from './profile_types';
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

const defaultSavedMethods: SavedPaymentMethod[] = [
  {
    id: 'pm-apple-pay',
    type: 'apple_pay',
    title: 'Apple Pay',
    subtitle: 'Основний спосіб',
    isDefault: true,
  },
  {
    id: 'pm-card-4821',
    type: 'card',
    title: '•••• 4821',
    subtitle: 'Термін: 08/28',
    isDefault: false,
    last4: '4821',
    expiry: '08/28',
  },
];

const defaultTransactions: PaymentTransaction[] = [
  {
    id: 'tx-1',
    title: 'СПА-комплекс (Барон)',
    dateFormatted: '20 Липня 2026 · 14:30',
    amount: 1200,
    serviceType: 'spa',
  },
  {
    id: 'tx-2',
    title: 'Експрес-лінька (Барон)',
    dateFormatted: '12 Травня 2026 · 10:00',
    amount: 850,
    serviceType: 'grooming',
  },
  {
    id: 'tx-3',
    title: 'Гігієнічний догляд (Луна)',
    dateFormatted: '05 Березня 2026 · 16:15',
    amount: 600,
    serviceType: 'hygiene',
  },
];

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
    fullName: initialUserData?.fullName || 'Катерина Ковальчук',
    avatarUrl: initialUserData?.avatarUrl ?? null,
    isVip: initialUserData?.isVip ?? true,
  });

  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>(
    initialMethods || defaultSavedMethods
  );
  const [transactions] = useState<PaymentTransaction[]>(
    initialTransactions || defaultTransactions
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
      const resolvedName = profile?.full_name || userMeta?.full_name || 'Катерина Ковальчук';
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
    }

    if (!initialUserData) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [initialUserData, initialMethods]);

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
      subtitle:
        method.type === 'apple_pay'
          ? method.id === id
            ? 'Основний спосіб'
            : undefined
          : method.subtitle,
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

                <div className="flex flex-col gap-3">
                  {savedMethods.map((method) => {
                    const isApplePay = method.type === 'apple_pay';
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
                            {isApplePay ? (
                              <svg
                                viewBox="0 0 170 170"
                                className="w-6 h-6 fill-content-dark"
                                aria-label="Apple Pay"
                              >
                                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.71-7.92-12.04-14.52-5.46-8.38-9.75-17.75-12.87-28.12-3.13-10.37-4.69-20.5-4.69-30.38 0-14.32 3.65-26.06 10.96-35.21 7.3-9.15 16.3-13.82 26.99-14.02 5.07 0 10.66 1.34 16.78 4.02 6.11 2.68 10.05 4.09 11.8 4.23 1.94-.14 6.07-1.63 12.39-4.48 6.31-2.85 11.96-4.14 16.94-3.87 12.63.76 22.7 5.25 30.21 13.48-11.03 6.72-16.42 16.03-16.18 27.93.24 9.4 3.86 17.27 10.86 23.6 7 6.34 15.22 10.06 24.66 11.16-2.07 6.34-4.58 12.7-7.55 19.07zM119.22 33.64c0-7.3 2.64-14.15 7.92-20.54 5.29-6.38 11.84-10.42 19.67-12.1-1.07 7.07-3.79 13.73-8.15 19.98-4.37 6.25-10.85 10.46-19.44 12.66z" />
                              </svg>
                            ) : (
                              <Icon name="fi-rr-credit-card" size={20} className="text-content-dark" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-accented font-semibold text-base text-content-dark">
                              {method.title}
                            </span>
                            {method.subtitle && (
                              <span
                                className={`text-xs ${
                                  method.isDefault && isApplePay
                                    ? 'text-[#34C759] font-medium'
                                    : 'text-text-muted font-primary'
                                }`}
                              >
                                {method.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!isApplePay && (
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
                          )}

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
                        placeholder="0000 0000 0000 0000"
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
                          placeholder="12/27"
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
                          placeholder="•••"
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
